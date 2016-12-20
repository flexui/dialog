var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var unique = document.getElementById('unique');
var remove = document.getElementById('remove');

var dialogs = [];

function create(id, title, content, options) {
  options = options || {};

  var dialog = FlexUI.dialog(content, {
    id: id,
    title: title,
    skin: options.skin,
    align: options.align,
    fixed: options.fixed,
    controls: [{
      title: '关闭',
      value: '×',
      which: 27,
      className: 'ui-dialog-control-close',
      action: function() {
        this.close();
      }
    }],
    buttons: options.buttons
  });

  dialog.on('closed', function() {
    if (remove.checked) {
      dialog.remove();
    }
  });

  return dialog;
}

$('#button').on('click', function() {
  var popup = create(unique.checked ? 'confirm' : null, '弹出消息', '<input class="ui-input" type="text" value="hello, world">', {
    buttons: [
      {
        which: 13,
        value: '确认',
        className: 'ui-button',
        action: function() {
          this.close();

          dialogs.push(create('alert', '提示', '你执行了确认操作！', {
            fixed: true,
            buttons: [{
              which: 13,
              value: '确认',
              className: 'ui-button',
              action: function() {
                this.close();
              }
            }]
          }).showModal());
        }
      },
      {
        which: 27,
        value: '取消',
        className: 'ui-button ui-button-white',
        action: function() {
          this.close();

          dialogs.push(create('alert', '提示', '你执行了取消操作！', {
            fixed: true,
            buttons: [{
              which: 13,
              value: '确认',
              className: 'ui-button',
              action: function() {
                this.close();
              }
            }]
          }).showModal());
        }
      }
    ]
  });

  dialogs.push(popup);

  if (!follow.checked) {
    if (!modal.checked) {
      popup.show();
    } else {
      popup.showModal();
    }
  } else {
    if (!modal.checked) {
      popup.show(this);
    } else {
      popup.showModal(this);
    }
  }
});

$('#destroy').on('click', function() {
  dialogs.forEach(function(dialog) {
    dialog.remove();
  });
});
