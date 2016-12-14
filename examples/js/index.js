var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var remove = document.getElementById('remove');

function create(id, title, content, buttons) {
  return new Dialog(content, {
    id: id,
    title: title,
    buttons: buttons
  });
}

$('#button').on('click', function() {
  var popup = create('confirm', null, 'hello, world', [
    {
      which: 13,
      label: '确认',
      className: 'ui-button',
      action: function() {
        this.close();

        create('alert', '提示', '你点击了确认按钮！', [{
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

        create('alert', '提示', '你点击了取消按钮！', [{
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
