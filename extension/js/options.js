import Credential from './credential.js';
import Kinnosuke from './kinnosuke.js';
import Notifier from './notifier.js';

const saveOptions = async () => {
  const credential = new Credential(
    document.getElementById('companycd').value,
    document.getElementById('logincd').value,
    document.getElementById('password').value
  );
  await credential.save();
  await Notifier.saveCredential();

  if (credential.valid()) {
    const app = await Kinnosuke.create();
    await app.login();
  }
};

const restoreOptions = async () => {
  const credential = await Credential.retrieve();
  document.getElementById('companycd').value = credential.companycd();
  document.getElementById('logincd').value = credential.logincd();
  document.getElementById('password').value = credential.password();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
