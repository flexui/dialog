var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var remove = document.getElementById('remove');

function create(id, title, content, options) {
  options = options || {};

  var dialog = new FlexUI.Dialog(content, {
    id: id,
    title: title,
    skin: options.skin,
    align: options.align,
    fixed: options.fixed,
    buttons: options.buttons
  });

  dialog.on('close', function() {
    if (remove.checked) {
      dialog.remove();
    }
  });

  return dialog;
}

$('#button').on('click', function() {
  var popup = create('confirm', null, 'hello, world', {
    buttons: [
      {
        which: 13,
        label: '确认',
        className: 'ui-button',
        action: function() {
          this.close();

          create('alert', '提示', '你执行了确认操作！', {
            fixed: true,
            buttons: [{
              which: 13,
              label: '确认',
              className: 'ui-button',
              action: function() {
                this.close();
              }
            }]
          }).showModal();
        }
      },
      {
        which: 27,
        label: '取消',
        className: 'ui-button ui-button-white',
        action: function() {
          this.close();

          create('alert', '提示', '你执行了取消操作！', {
            fixed: true,
            buttons: [{
              which: 13,
              label: '确认',
              className: 'ui-button',
              action: function() {
                this.close();
              }
            }]
          }).showModal();
        }
      }
    ]
  });

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
