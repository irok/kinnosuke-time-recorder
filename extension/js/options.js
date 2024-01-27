import Credential from './credential.js';
import Kinnosuke from './kinnosuke.js';

const saveOptions = async (event) => {
  event.preventDefault();
  const app = await Kinnosuke.create();

  const credential = new Credential(
    document.getElementById('companycd').value,
    document.getElementById('logincd').value,
    document.getElementById('password').value
  );
  await credential.save();
  await app.notifier.saveCredential();

  if (credential.valid()) {
    await app.login();
  } else {
    await app.logout();
  }
};

const restoreOptions = async () => {
  const credential = await Credential.retrieve();
  document.getElementById('companycd').value = credential.companycd();
  document.getElementById('logincd').value = credential.logincd();
  document.getElementById('password').value = credential.password();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('submit', saveOptions);
