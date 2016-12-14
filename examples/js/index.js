var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var remove = document.getElementById('remove');

function create(id, content, buttons) {
  var dialog = new Dialog(content, {
    id: id,
    buttons: buttons
  });

  var reset = function() {
    dialog.reset();
  };

  __window.on('resize', reset);

  dialog.on('close', function() {
    if (remove.checked) {
      dialog.remove();
    }
  });

  dialog.on('remove', function() {
    __window.off('resize', reset);
  });

  return dialog;
}

$('#button').on('click', function() {
  var popup = create('confirm', 'hello, world', [
    {
      which: 13,
      label: '确认',
      className: 'ui-button',
      action: function() {
        this.close();

        create('alert', '你点击了确认按钮！', [{
          which: 13,
          label: '确认',
          className: 'ui-button',
          action: function() {
            this.close();
          }
        }]).showModal();
      }
    },
    {
      which: 27,
      label: '取消',
      className: 'ui-button ui-button-white',
      action: function() {
        this.close();

        create('alert', '你点击了取消按钮！', [{
          which: 13,
          label: '确认',
          className: 'ui-button',
          action: function() {
            this.close();
          }
        }]).showModal();
      }
    }
  ]);

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
