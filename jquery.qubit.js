import $ from 'jquery';

class Qubit {
  constructor(el) {
    let self = this;
    this.itemSelector = 'li';
    this.scope = $(el);

    let handler = (e) => {
      if (!self.suspendListeners) self.process(e.target);
    };

    this.scope.on('change', 'input[type=checkbox]', handler);
    this.processParents();
  }

  process(checkbox) {
    checkbox = $(checkbox);
    let parentItems = checkbox.parentsUntil(this.scope, this.itemSelector);
    let self = this;
    try {
      this.suspendListeners = true;
      // all children inherit my state
      parentItems.eq(0).find('input[type=checkbox]').not(':disabled')
        .filter(checkbox.prop('checked') ? ':not(:checked)' : ':checked')
        .each(function () {
          if (!$(this).parent().hasClass('hidden')) {
            self.setChecked($(this), checkbox.prop('checked'));
          }
        })
        .trigger('change');
      this.processParents();
    } finally {
      this.suspendListeners = false;
    }
  }

  processParents() {
    let self = this;
    let changed = false;
    this.scope.find('input[type=checkbox]').not(':disabled').each(function () {
      let $this = $(this);
      let parent = $this.closest(self.itemSelector);
      let children = parent.find('input[type=checkbox]').not(':disabled').not($this);
      let numChecked = children.filter(function () {
        return $(this).prop('checked') || $(this).prop('indeterminate');
      }).length;

      if (children.length) {
        if (numChecked === 0) {
          if (self.setChecked($this, false)) changed = true;
        } else if (numChecked === children.length) {
          if (self.setChecked($this, true)) changed = true;
        } else {
          if (self.setIndeterminate($this, true)) changed = true;
        }
      } else {
        if (self.setIndeterminate($this, false)) changed = true;
      }
    });
    if (changed) this.processParents();
  }

  setChecked(checkbox, value) {
    let changed = false;
    if (checkbox.prop('indeterminate')) {
      checkbox.prop('indeterminate', false);
      changed = true;
    }
    if (checkbox.prop('checked') !== value) {
      checkbox.prop('checked', value).trigger('change');
      changed = true;
    }
    return changed;
  }

  setIndeterminate(checkbox, value) {
    if (value) {
      checkbox.prop('checked', false);
    }

    if (checkbox.prop('indeterminate') !== value) {
      checkbox.prop('indeterminate', value);
      return true;
    }

    return false;
  }
}

$.fn.qubit = function (options) {
  return this.each(function () {
    new Qubit(this, options);
  });
};
