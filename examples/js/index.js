var popup;
var __window = $(window);
var follow = document.getElementById('follow');
var modal = document.getElementById('modal');
var remove = document.getElementById('remove');

function create() {
  var dialog = new Dialog();

  dialog.innerHTML = '<div class="ui-dialog-content"><span>hello, world</span><a class="button ui-close">关闭</a></div>';

  var reset = function() {
    dialog.reset();
  };

  __window.on('resize', reset);

  dialog.on('focus', function() {
    console.log('focus');
  });

  dialog.on('blur', function() {
    console.log('blur');
  });

  dialog.on('show', function() {
    console.log('show');
  });

  dialog.on('beforeclose', function() {
    console.log('beforeclose');
  });

  dialog.on('close', function() {
    console.log('close');

    if (remove.checked) {
      dialog.remove();

      popup = null;
    }
  });

  dialog.on('beforeremove', function() {
    console.log('beforeremove');
  });

  dialog.on('remove', function() {
    console.log('remove');

    __window.off('resize', reset);
  });

  $(dialog.node).on('click', '.ui-close', function() {
    dialog.close();
  });

  return dialog;
}

$('#button').on('click', function() {
  popup = popup || create();

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
