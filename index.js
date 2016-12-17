import Dialog from './dialog.js';
import { setZIndex, getZIndex } from '@flexui/z-index';

var FlexUI = {
  dialog: Dialog,
  zIndex: function(value) {
    if (arguments.length) {
      return setZIndex(value)
    } else {
      return getZIndex();
    }
  }
};

export default FlexUI;
