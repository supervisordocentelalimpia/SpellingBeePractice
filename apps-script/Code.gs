const APP_VERSION = '4.0.0';
const SPREADSHEET_ID = '1OySIbVR0ov8n2CAJief4H25qPxB-kVxFjIrK552omoU';
const SHEETS = {
  students: 'Students',
  sessions: 'Sessions',
  log: 'Activity_Log',
  dashboard: 'Dashboard',
  words: 'Word_Analysis',
  quality: 'Data_Quality',
  overview: 'Student_Overview'
};

const HEADERS = {
  Students: [
    'Student_ID','Student_Name','First_Seen','Last_Seen','Sessions','Activities_Completed',
    'Correct_Answers','Attempts','Accuracy','Bee_Arena_Rounds','Total_Practice_Min',
    'Last_Activity','Last_Score','Status','Normalized_Name'
  ],
  Sessions: [
    'Session_ID','Student_ID','Student_Name','Start_Time','End_Time','Duration_Min','Language',
    'Activities_Started','Activities_Completed','Correct','Attempts','Accuracy','Best_Streak',
    'Bee_Arena_Rounds','Last_Activity','Completed','Launch_Key'
  ],
  Activity_Log: [
    'Timestamp','Session_ID','Student_ID','Student_Name','Event','Activity_ID','Activity_Name','Word',
    'Result','Attempt_Number','Score_After','Streak_After','Elapsed_Sec','Bee_Overtime','Language','Notes',
    'Skill_Domain','First_Attempt','Tech_Status','App_Version','Event_Key','Question_No','Item_Key'
  ]
};

function doGet(e) {
  ensureStructure_();
  return ContentService.createTextOutput(JSON.stringify({
    ok:true,
    app:'CEVAZ Spelling Bee Practice API',
    version:APP_VERSION,
    spreadsheetId:SPREADSHEET_ID,
    mode:'backend-only'
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupBackend() {
  ensureStructure_();
  return repairMetrics();
}

/**
 * Cross-origin audit endpoint for the standalone HTTPS frontend.
 * Send application/x-www-form-urlencoded with a `payload` field containing JSON.
 */
function doPost(e) {
  try {
    ensureStructure_();
    const payload = parseRequest_(e);
    const action = String(payload.action || 'log').toLowerCase();
    let result;
    if (action === 'register') result = registerStudent(payload);
    else if (action === 'log') result = logEvent(payload);
    else if (action === 'health') result = {ok:true, version:APP_VERSION};
    else throw new Error('Unknown action.');
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err && err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function registerStudent(data) {
  ensureStructure_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const students = ss.getSheetByName(SHEETS.students);
    const sessions = ss.getSheetByName(SHEETS.sessions);

    const name = cleanName_(data && (data.name || data.studentName));
    if (!name) throw new Error('Student name is required.');
    const normalized = normalizeName_(name);
    const launchKey = cleanKey_(data && data.launchKey, 120);

    // 1) Prefer a verified existing ID only if it belongs to the same normalized name.
    let studentId = cleanKey_(data && (data.studentId || data.existingStudentId), 80);
    let studentRow = studentId ? findRowById_(students, studentId) : 0;
    if (studentRow && normalizeName_(students.getRange(studentRow, 2).getDisplayValue()) !== normalized) {
      studentRow = 0;
      studentId = '';
    }

    // 2) Name-normalized lookup prevents Ernesto Benavides from becoming 4 students.
    if (!studentRow) studentRow = findStudentByNormalizedName_(students, normalized);

    if (!studentRow) {
      if (!studentId) studentId = makeStableStudentId_(normalized);
      // If the deterministic ID already exists for a different visible name, use a UUID suffix.
      const idRow = findRowById_(students, studentId);
      if (idRow) studentId = 'STU-' + Utilities.getUuid().split('-')[0].toUpperCase();
      students.appendRow([studentId,name,new Date(),new Date(),0,0,0,0,0,0,0,'',0,'Active',normalized]);
      studentRow = students.getLastRow();
    } else {
      studentId = String(students.getRange(studentRow,1).getValue());
      students.getRange(studentRow,2).setValue(name);
      students.getRange(studentRow,4).setValue(new Date());
      students.getRange(studentRow,14).setValue('Active');
      students.getRange(studentRow,15).setValue(normalized);
    }
    setStudentFormulas_(students, studentRow);

    // Idempotent launch: a repeated click/reload reuses the same Launch_Key/session.
    let sessionRow = launchKey ? findSessionByLaunchKey_(sessions, launchKey) : 0;
    let sessionId = '';
    if (sessionRow && String(sessions.getRange(sessionRow,2).getValue()) === studentId) {
      sessionId = String(sessions.getRange(sessionRow,1).getValue());
    } else {
      sessionId = cleanKey_(data && data.sessionId, 80) || ('SES-' + Utilities.getUuid().split('-')[0].toUpperCase());
      const existingSessionRow = findRowById_(sessions, sessionId);
      if (existingSessionRow) {
        sessionRow = existingSessionRow;
      } else {
        sessions.appendRow([
          sessionId,studentId,name,new Date(),'','',String((data && data.language) || 'en'),
          0,0,0,0,0,0,0,'',false,launchKey
        ]);
        sessionRow = sessions.getLastRow();
      }
    }
    setSessionFormulas_(sessions, sessionRow);
    SpreadsheetApp.flush();

    return {
      ok:true,
      studentId,
      sessionId,
      reusedSession:Boolean(launchKey && findSessionByLaunchKey_(sessions, launchKey) === sessionRow),
      progress: studentProgress_(students, studentRow)
    };
  } finally {
    lock.releaseLock();
  }
}

function logEvent(e) {
  ensureStructure_();
  if (!e) return {ok:false,error:'Missing event payload.'};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const log = ss.getSheetByName(SHEETS.log);
    const students = ss.getSheetByName(SHEETS.students);
    const sessions = ss.getSheetByName(SHEETS.sessions);

    const name = cleanName_(e.studentName || e.name);
    if (!name) return {ok:false,error:'Missing student name.'};
    const normalized = normalizeName_(name);

    let studentId = cleanKey_(e.studentId,80);
    let studentRow = studentId ? findRowById_(students,studentId) : 0;
    if (!studentRow) studentRow = findStudentByNormalizedName_(students,normalized);
    if (!studentRow) {
      studentId = studentId || makeStableStudentId_(normalized);
      students.appendRow([studentId,name,new Date(),new Date(),0,0,0,0,0,0,0,'',0,'Active',normalized]);
      studentRow = students.getLastRow();
    } else {
      studentId = String(students.getRange(studentRow,1).getValue());
    }
    students.getRange(studentRow,2).setValue(name);
    students.getRange(studentRow,4).setValue(new Date());
    students.getRange(studentRow,15).setValue(normalized);
    setStudentFormulas_(students,studentRow);

    let sessionId = cleanKey_(e.sessionId,80) || ('SES-' + Utilities.getUuid().split('-')[0].toUpperCase());
    let sessionRow = findRowById_(sessions,sessionId);
    if (!sessionRow) {
      sessions.appendRow([
        sessionId,studentId,name,new Date(),'','',String(e.language||'en'),0,0,0,0,0,0,0,'',false,
        cleanKey_(e.launchKey,120)
      ]);
      sessionRow = sessions.getLastRow();
    }
    setSessionFormulas_(sessions,sessionRow);

    const eventKey = cleanKey_(e.eventKey,180) || buildEventKey_(e,sessionId);
    if (eventKey && findEventByKey_(log,eventKey)) {
      return {ok:true,duplicate:true,studentId,sessionId};
    }

    const event = cleanText_(e.event,50);
    const result = cleanText_(e.result,50);
    const attempt = Math.max(0, Number(e.attemptNumber || 0));
    const activityId = Number(e.activityId || 0) || '';
    const score = Number(e.scoreAfter || 0);
    const streak = Number(e.streakAfter || 0);
    const elapsed = Math.max(0, Number(e.elapsedSec || 0));
    const questionNo = Math.max(0, Number(e.questionNo || 0)) || '';
    const ts = e.timestamp ? new Date(e.timestamp) : new Date();

    log.appendRow([
      ts,sessionId,studentId,name,event,activityId,cleanText_(e.activityName,80),cleanText_(e.word,80),
      result,attempt,score,streak,elapsed,Boolean(e.beeOvertime),String(e.language||'en'),cleanText_(e.notes,250),
      cleanText_(e.skillDomain,120),Boolean(e.firstAttempt),cleanText_(e.techStatus,80),
      cleanText_(e.appVersion || APP_VERSION,40),eventKey,questionNo,cleanKey_(e.itemKey,180)
    ]);

    // Values that are not formula-derived.
    students.getRange(studentRow,12).setValue(cleanText_(e.activityName,80));
    if (event === 'ACTIVITY_COMPLETE' || (event === 'ANSWER' && result === 'CORRECT')) {
      students.getRange(studentRow,13).setValue(score);
    }
    if (e.activityName) sessions.getRange(sessionRow,15).setValue(cleanText_(e.activityName,80));

    const started = sessions.getRange(sessionRow,4).getValue();
    if (started instanceof Date) sessions.getRange(sessionRow,6).setValue(Math.round(((new Date()-started)/60000)*10)/10);
    if (event === 'SESSION_END') {
      sessions.getRange(sessionRow,5).setValue(new Date());
      sessions.getRange(sessionRow,16).setValue(true);
    }

    SpreadsheetApp.flush();
    return {ok:true,duplicate:false,studentId,sessionId};
  } finally {
    lock.releaseLock();
  }
}

function repairMetrics() {
  ensureStructure_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const students = ss.getSheetByName(SHEETS.students);
  const sessions = ss.getSheetByName(SHEETS.sessions);
  for (let r=2; r<=students.getLastRow(); r++) {
    const name = cleanName_(students.getRange(r,2).getDisplayValue());
    if (!name) continue;
    students.getRange(r,15).setValue(normalizeName_(name));
    setStudentFormulas_(students,r);
  }
  for (let r=2; r<=sessions.getLastRow(); r++) {
    if (!sessions.getRange(r,1).getValue()) continue;
    setSessionFormulas_(sessions,r);
  }
  SpreadsheetApp.flush();
  return {ok:true, students:Math.max(0,students.getLastRow()-1), sessions:Math.max(0,sessions.getLastRow()-1)};
}

function ensureStructure_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = HEADERS[name];
    if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length)
      .setBackground('#315FD4').setFontColor('#FFFFFF').setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  });
  const students = ss.getSheetByName(SHEETS.students);
  const sessions = ss.getSheetByName(SHEETS.sessions);
  try { students.hideColumns(15); } catch (_) {}
  try { sessions.hideColumns(17); } catch (_) {}
}

function setStudentFormulas_(sh,row) {
  sh.getRange(row,5).setFormula(`=COUNTIF(Sessions!B:B,A${row})`);
  sh.getRange(row,6).setFormula(`=COUNTIFS(Activity_Log!C:C,A${row},Activity_Log!E:E,"ACTIVITY_COMPLETE")`);
  sh.getRange(row,7).setFormula(`=COUNTIFS(Activity_Log!C:C,A${row},Activity_Log!E:E,"ANSWER",Activity_Log!I:I,"CORRECT")`);
  sh.getRange(row,8).setFormula(`=COUNTIFS(Activity_Log!C:C,A${row},Activity_Log!E:E,"ANSWER")+COUNTIFS(Activity_Log!C:C,A${row},Activity_Log!E:E,"PROCESS_RETRY")`);
  sh.getRange(row,9).setFormula(`=IF(H${row}=0,0,G${row}/H${row})`).setNumberFormat('0.0%');
  sh.getRange(row,10).setFormula(`=COUNTIFS(Activity_Log!C:C,A${row},Activity_Log!F:F,6,Activity_Log!E:E,"ANSWER",Activity_Log!I:I,"CORRECT")`);
  sh.getRange(row,11).setFormula(`=ROUND(SUMIF(Sessions!B:B,A${row},Sessions!F:F),1)`);
}

function setSessionFormulas_(sh,row) {
  sh.getRange(row,8).setFormula(`=COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!E:E,"ACTIVITY_START")`);
  sh.getRange(row,9).setFormula(`=COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!E:E,"ACTIVITY_COMPLETE")`);
  sh.getRange(row,10).setFormula(`=COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!E:E,"ANSWER",Activity_Log!I:I,"CORRECT")`);
  sh.getRange(row,11).setFormula(`=COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!E:E,"ANSWER")+COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!E:E,"PROCESS_RETRY")`);
  sh.getRange(row,12).setFormula(`=IF(K${row}=0,0,J${row}/K${row})`).setNumberFormat('0.0%');
  sh.getRange(row,13).setFormula(`=IFERROR(MAX(FILTER(Activity_Log!L:L,Activity_Log!B:B=A${row},Activity_Log!E:E="ANSWER")),0)`);
  sh.getRange(row,14).setFormula(`=COUNTIFS(Activity_Log!B:B,A${row},Activity_Log!F:F,6,Activity_Log!E:E,"ANSWER",Activity_Log!I:I,"CORRECT")`);
}

function studentProgress_(sh,row) {
  return {
    sessions:Number(sh.getRange(row,5).getValue()||0),
    activities:Number(sh.getRange(row,6).getValue()||0),
    correct:Number(sh.getRange(row,7).getValue()||0),
    attempts:Number(sh.getRange(row,8).getValue()||0),
    accuracy:Number(sh.getRange(row,9).getValue()||0),
    beeRounds:Number(sh.getRange(row,10).getValue()||0),
    practiceMin:Number(sh.getRange(row,11).getValue()||0)
  };
}

function parseRequest_(e) {
  if (!e) return {};
  if (e.parameter && e.parameter.payload) {
    try { return JSON.parse(e.parameter.payload); } catch (_) {}
  }
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  const out = {};
  Object.keys((e && e.parameter) || {}).forEach(k => out[k] = e.parameter[k]);
  return out;
}

function findRowById_(sh,id) {
  if (!id || sh.getLastRow() < 2) return 0;
  const found = sh.getRange(2,1,sh.getLastRow()-1,1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

function findStudentByNormalizedName_(sh,normalized) {
  if (!normalized || sh.getLastRow() < 2) return 0;
  // Backfill normalized names when needed so legacy rows also deduplicate correctly.
  const values = sh.getRange(2,2,sh.getLastRow()-1,14).getDisplayValues();
  for (let i=0; i<values.length; i++) {
    const visibleName = values[i][0];
    const storedNormalized = values[i][13];
    const n = storedNormalized || normalizeName_(visibleName);
    if (!storedNormalized && visibleName) sh.getRange(i+2,15).setValue(n);
    if (n === normalized) return i+2;
  }
  return 0;
}

function findSessionByLaunchKey_(sh,key) {
  if (!key || sh.getLastRow() < 2) return 0;
  const found = sh.getRange(2,17,sh.getLastRow()-1,1)
    .createTextFinder(String(key)).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

function findEventByKey_(sh,key) {
  if (!key || sh.getLastRow() < 2) return 0;
  const found = sh.getRange(2,21,sh.getLastRow()-1,1)
    .createTextFinder(String(key)).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

function cleanName_(name) {
  return String(name||'')
    .replace(/[<>]/g,'')
    .replace(/\s+/g,' ')
    .trim()
    .slice(0,60);
}

function normalizeName_(name) {
  return cleanName_(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function makeStableStudentId_(normalized) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalized || Utilities.getUuid());
  const hex = bytes.slice(0,5).map(b => ('0'+((b+256)%256).toString(16)).slice(-2)).join('').toUpperCase();
  return 'STU-' + hex;
}

function buildEventKey_(e,sessionId) {
  return [sessionId,e.activityId||'',e.questionNo||'',e.itemKey||'',e.event||'',e.attemptNumber||'',e.word||'',e.result||'']
    .map(x=>String(x).replace(/\|/g,'/')).join('|').slice(0,180);
}

function cleanKey_(value,maxLen) {
  return String(value||'').replace(/[^A-Za-z0-9_\-|:.]/g,'').slice(0,maxLen||120);
}

function cleanText_(value,maxLen) {
  return String(value||'').replace(/[<>]/g,'').slice(0,maxLen||250);
}