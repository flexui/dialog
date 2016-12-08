var dialog;
var __window = $(window);
var anchor = $('#anchor');
var alignView = $('#test-align-value');

__window.on('resize.dialog', function() {
  dialog && dialog.reset();
});

anchor
  .on('change', '[type=radio]', function() {
    if (dialog) {
      dialog.close();
    }

    dialog = new Dialog();

    dialog.on('close', function() {
      this.remove();
    });

    dialog.innerHTML = '<div class="ui-bubble">' +
      '<div class="ui-bubble-arrow-a"></div>' +
      '<div class="ui-bubble-arrow-b"></div>' +
      '<div class="ui-bubble-content">' +
      'hello, world' +
      '</div>' +
      '</div>';

    var align = $(this).val();

    dialog.align = align;

    dialog.show(anchor[0]);
    alignView.html(align);
  })
  .find(':radio:checked')
  .trigger('change');
