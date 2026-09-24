import { createStorage } from './utils/storage.js';
import { WordModel } from './models/WordModel.js';
import { SessionModel } from './models/SessionModel.js';
import { SettingsModel } from './models/SettingsModel.js';
import { RewardModel } from './models/RewardModel.js';
import { SpeechController } from './controllers/SpeechController.js';
import { SpellingController } from './controllers/SpellingController.js';
import { AppController } from './controllers/AppController.js';

const root = document.getElementById('app');
const storage = createStorage();
const app = new AppController({
  root,
  wordModel: new WordModel(),
  sessionModel: new SessionModel(),
  rewardModel: new RewardModel(storage),
  settingsModel: new SettingsModel(storage),
  speechController: new SpeechController(),
  spellingController: new SpellingController()
});

app.init();
