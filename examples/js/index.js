var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var remove = document.getElementById('remove');

function create() {
  var dialog = new Dialog('hello, world', {
    id: 'confirm',
    buttons: [{
      which: 13,
      label: '确认',
      className: 'ui-button',
      action: function() {
        this.close();
      }
    }, {
      which: 27,
      label: '取消',
      className: 'ui-button ui-button-white',
      action: function() {
        this.close();
      }
    }]
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
    // console.log('remove');

    __window.off('resize', reset);
  });

  return dialog;
}

$('#button').on('click', function() {
  var popup = create();

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
