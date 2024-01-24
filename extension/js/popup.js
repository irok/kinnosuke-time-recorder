import Kinnosuke from './kinnosuke.js';

// 初期化
$(async () => {
  const app = await Kinnosuke.create();
  if (!app.state.authorized()) {
    await app.login();
  }

  if (app.state.authorized()) {
    $('.stamp-block').css('display', 'table');
    renderStamp(app);
    renderMenu(app);
  }

  // 勤之助を開く
  $('#link-top').on('click', () => Kinnosuke.open());

  // オプション
  $('#link-option').on('click', async () => await chrome.runtime.openOptionsPage());
});

// 出社・退社の表示
const renderStamp = (app) => {
  if (app.state.startTime()) {
    $('#start-work').text(`出社 ${ app.state.startTime() }`).removeClass('enabled').off();
  } else {
    $('#start-work').text('出社').addClass('enabled').off().on('click', async () => {
      if (await confirmDialog('出社しましたか？')) {
        await app.startWork() && await renderStamp(app);
      }
    });
  }

  if (app.state.leaveTime()) {
    $('#leave-work').text(`退社 ${ app.state.leaveTime() }`).removeClass('enabled').off();
  } else {
    $('#leave-work').text('退社').addClass('enabled').off().on('click', async () => {
      if (await confirmDialog('退社しますか？')) {
        await app.leaveWork() && await renderStamp(app);
      }
    });
  }
};

// メニューの表示
const renderMenu = (app) => {
  const linkTop = $('#link-top');

  if (linkTop.parent().find('.menu').length === 0) {
    for (const { title, module, action, icon } of app.menus.items()) {
      $(`<li class="menu enabled" data-module="${ module }" data-action="${ action }"/>`)
        .append($(`<img src="${ Kinnosuke.SiteUrl }${ icon }"/>`))
        .append($(`<span>${ title }</span>`))
        .insertBefore(linkTop);
    }

    // jQuery から渡される this を受け取るため function が必要
    $('.menu').click(function () {
      Kinnosuke.open(this.dataset);
    });
  }
};

// 確認ダイアログ
const confirmDialog = (message) => {
  const target = $('#modal-dialog');
  const container = $('<div/>').hide();
  const modal = $('<div class="modal"/>');
  const dialog = $('<div class="dialog"/>');
  const btn1 = $('<button class="confirm"/>');
  const btn2 = $('<button class="confirm"/>');

  // 閉じる処理
  const close = () => container.hide(50, () => container.empty().remove());

  return new Promise((resolve) => {
    container
      .append(modal)
      .append(dialog
        .append($(`<p>${ message }</p>`))
        .append(btn1.text(' はい ').click(() => { close(); resolve(true); }))
        .append(btn2.text('いいえ').click(() => { close(); resolve(false); }))
      )
      .appendTo(target)
      .show(150, () => {
        dialog.css('top', (modal.innerHeight() - dialog.innerHeight()) / 2);
      });
  });
};
