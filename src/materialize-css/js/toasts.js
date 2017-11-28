(function($, Vel) {
  'use strict';

  var _defaults = {
    displayLength: Infinity,
    inDuration: 300,
    outDuration: 375,
    className: undefined,
    completeCallback: undefined,
    activationPercent: 0.8
  };

  function Toast(parentSelector, message, displayLength, className, completeCallback) {
    this.defaults = function () {
      return _defaults;
    };

    /**
     * Append toast container and add event handlers
     */
    function _createContainer () {
      var container = document.createElement('div');
      container.setAttribute('id', 'toast-container');

      // Add event handler
      container.addEventListener('touchstart', _onDragStart);
      container.addEventListener('touchmove', _onDragMove);
      container.addEventListener('touchend', _onDragEnd);

      container.addEventListener('mousedown', _onDragStart);
      document.addEventListener('mousemove', _onDragMove);
      document.addEventListener('mouseup', _onDragEnd);

      if (parentSelector) {
          parentSelector.appendChild(container)
      } else {
          document.body.appendChild(container);
      }
      Toast._container = container;
    }

    /**
     * Remove toast container and event handlers
     */
    function _removeContainer () {
      // Add event handler
      document.removeEventListener('mousemove', Toast._onDragMove);
      document.removeEventListener('mouseup', Toast._onDragEnd);

      Toast._container.parentNode.removeChild(Toast._container);
      Toast._container = null;
    }

    /**
     * Begin drag handler
     * @param {Event} e
     */
    function _onDragStart (e) {
      if (e.target && $(e.target).closest('.toast').length) {
        var $toast = $(e.target).closest('.toast');
        var toast = $toast[0].M_Toast;
        toast.panning = true;
        Toast._draggedToast = toast;
        toast.el.classList.add('panning');
        toast.el.style.transition = '';
        toast.startingXPos = Toast._xPos(e);
        toast.time = Date.now();
        toast.xPos = Toast._xPos(e);
      }
    }

    /**
     * Drag move handler
     * @param {Event} e
     */
    function _onDragMove (e) {
      if (!!Toast._draggedToast) {
        e.preventDefault();
        var toast = Toast._draggedToast;
        toast.deltaX = Math.abs(toast.xPos - Toast._xPos(e));
        toast.xPos = Toast._xPos(e);
        toast.velocityX = toast.deltaX / (Date.now() - toast.time);
        toast.time = Date.now();

        var totalDeltaX = toast.xPos - toast.startingXPos;
        var activationDistance =
            toast.el.offsetWidth * toast.options.activationPercent;
        toast.el.style.transform = 'translateX(' + totalDeltaX + 'px)';
        toast.el.style.opacity = 1-Math.abs(totalDeltaX / activationDistance);
      }
    }

    /**
     * End drag handler
     * @param {Event} e
     */
    function _onDragEnd (e) {
      if (!!Toast._draggedToast) {
        var toast = Toast._draggedToast;
        toast.panning = false;
        toast.el.classList.remove('panning');

        var totalDeltaX = toast.xPos - toast.startingXPos;
        var activationDistance =
            toast.el.offsetWidth * toast.options.activationPercent;
        var shouldBeDismissed = Math.abs(totalDeltaX) > activationDistance ||
            toast.velocityX > 1;

        // Remove toast
        if (shouldBeDismissed) {
          toast.wasSwiped = true;
          toast.remove();

        // Animate toast back to original position
        } else {
          toast.el.style.transition = 'transform .2s, opacity .2s';
          toast.el.style.transform = '';
          toast.el.style.opacity = '';
        }
        Toast._draggedToast = null;
      }
    }

    /**
     * Get x position of mouse or touch event
     * @param {Event} e
     */
    function _xPos (e) {
      if (e.targetTouches && (e.targetTouches.length >= 1)) {
        return e.targetTouches[0].clientX;
      }
      // mouse event
      return e.clientX;
    }

    /**
     * Remove all toasts
     */
    function removeAll () {
      for(var toastIndex in Toast._toasts) {
        Toast._toasts[toastIndex].remove();
      }
    }


    /**
     * Create toast and append it to toast container
     */
    this.createToast = function () {
      var toast = document.createElement('div');
      toast.classList.add('toast');
      toast.classList.add('m');

      // Add custom classes onto toast
      if (this.options.className) {
        var classes = this.options.className.split(' ');
        var i, count;
        for (i = 0, count = classes.length; i < count; i++) {
          toast.classList.add(classes[i]);
        }
      }

      // Set content
      if ( typeof HTMLElement === 'object' ?
           this.message instanceof HTMLElement :
           this.message && typeof this.message === 'object' &&
           this.message !== null && this.message.nodeType === 1 &&
           typeof this.message.nodeName==='string'
         ) {
        toast.appendChild(this.message);

      // Check if it is jQuery object
      } else if (this.message instanceof jQuery) {
        $(toast).append(this.message);

        // Insert as text;
      } else {
        toast.innerHTML = this.message;
      }

      // Append toasft
      Toast._container.appendChild(toast);
      return toast;
    };

    /**
     * Animate in toast
     */
    this._animateIn = function () {
      // Animate toast in
      Vel(this.el, {top: 0,  opacity: 1 }, {
        duration: 300,
        easing: 'easeOutCubic',
        queue: false
      });
    };


    /**
     * Create setInterval which automatically removes toast when timeRemaining >= 0
     * has been reached
     */
    this.setTimer = function () {
      if (this.timeRemaining !== Infinity)  {
        this.counterInterval = setInterval(function () {
          // If toast is not being dragged, decrease its time remaining
          if (!this.panning) {
            this.timeRemaining -= 20;
          }

          // Animate toast out
          if (this.timeRemaining <= 0) {
            this.remove();
          }
        }.bind(this), 20);
      }
    };


    /**
     * Dismiss toast with animation
     */
    this.remove = function () {
      window.clearInterval(this.counterInterval);
      var activationDistance =
          this.el.offsetWidth * this.options.activationPercent;

      if(this.wasSwiped) {
        this.el.style.transition = 'transform .05s, opacity .05s';
        this.el.style.transform = 'translateX(' + activationDistance + 'px)';
        this.el.style.opacity = 0;
      }

      Vel(
        this.el,
        {opacity: 0, marginTop: '-40px'},
        {
          duration: this.options.outDuration,
          easing: 'easeOutExpo',
          queue: false,
          complete: function () {
            // Call the optional callback
            if(typeof(this.options.completeCallback) === 'function') {
              this.options.completeCallback();
            }
            // Remove toast from DOM
            this.el.parentNode.removeChild(this.el);
            Toast._toasts.splice(Toast._toasts.indexOf(this), 1);
            if (Toast._toasts.length === 0) {
              _removeContainer();
            }
          }.bind(this)
        }
      );
    };

    (function _constructor (message, displayLength, className, completeCallback) {
        if (!message) {
            return;
        }


        /**
         * Options for the toast
         * @member Toast#options
         */
        this.options = {
            displayLength: displayLength,
            className: className,
            completeCallback: completeCallback
        };

        this.options = $.extend({}, Toast.defaults, this.options);
        this.message = message;

        /**
         * Describes current pan state toast
         * @type {Boolean}
         */
        this.panning = false;

        /**
         * Time remaining until toast is removed
         */
        this.timeRemaining = this.options.displayLength;

        if (Toast._toasts.length === 0) {
            _createContainer();
        }

        // Create new toast
        Toast._toasts.push(this);
        var toastElement = this.createToast();
        toastElement.M_Toast = this;
        this.el = toastElement;
        this._animateIn();
        this.setTimer();
    }.bind(this))(message, displayLength, className, completeCallback);
    return this;
  }

  /**
   * @static
   * @memberof Toast
   * @type {Array.<Toast>}
   */
  Toast._toasts = [];

  /**
   * @static
   * @memberof Toast
   */
  Toast._container = null;

  /**
   * @static
   * @memberof Toast
   * @type {Toast}
   */
  Toast._draggedToast = null;

  Materialize.Toast = Toast;
  Materialize.toast = function(parentSelector, message, displayLength, className, completeCallback) {
    return new Toast(parentSelector, message, displayLength, className, completeCallback);
  };
})(jQuery, Materialize.Vel);
