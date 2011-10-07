/*
 * SmartWizard 2.0 plugin
 * jQuery Wizard control Plugin
 * by Dipu
 *
 * http://www.techlaboratory.net
 * http://tech-laboratory.blogspot.com
 *
 * Refactored and extended:
 * https://github.com/mstratman/jQuery-Smart-Wizard
 */

(function($){

var SmartWizard = function(target, options) {
    this.target       = target;
    this.options      = options;
    this.curStepIdx   = options.selected;
    this.steps        = $("ul > li > a", target); // Get all anchors in this array
    this.contentWidth = 0;
    this.msgBox = $('<div class="msgBox"><div class="content"></div><a href="#" class="close">X</a></div>');
    this.elmStepContainer = $('<div></div>').addClass("stepContainer");
    this.loader = $('<div>Loading</div>').addClass("loader");
    this.buttons = {
        next : $('<a>'+options.labelNext+'</a>').attr("href","#").addClass("buttonNext"),
        previous : $('<a>'+options.labelPrevious+'</a>').attr("href","#").addClass("buttonPrevious"),
        finish  : $('<a>'+options.labelFinish+'</a>').attr("href","#").addClass("buttonFinish")
    };

    var _init = function($this) {
        var elmActionBar = $('<div></div>').addClass("actionBar"),
        elmActionBar.append($this.msgBox);
        $('.close',this.msgBox).click(function() {
            $this.msgBox.fadeOut("normal");
            return false;
        });

        var allDivs = $this.target.children('div');
        $this.target.children('ul').addClass("anchor");
        allDivs.addClass("content");

        // highlight steps with errors
        if($this.options.errorSteps && $this.options.errorSteps.length>0){
            $.each($this.options.errorSteps, function(i, n){
                $this.setError({ stepnum: n, iserror:true });
            });
        }

        $this.elmStepContainer.append(allDivs);
        elmActionBar.append($this.loader);
        $this.target.append($this.elmStepContainer);
        $this.target.append(elmActionBar);
        elmActionBar.append($this.buttons.finish)
                    .append($this.buttons.next)
                    .append($this.buttons.previous);
        this.contentWidth = $this.elmStepContainer.width();

        $($this.buttons.next).click(function() {
            $this.goForward();
            return false;
        });
        $($this.buttons.previous).click(function() {
            $this.goBackward();
            return false;
        });
        $($this.buttons.finish).click(function() {
            if(!$(this).hasClass('buttonDisabled')){
                if($.isFunction($this.options.onFinish)) {
                    if(!$this.options.onFinish.call(this,$($this.steps))){
                        return false;
                    }
                }else{
                    var frm = $this.target.parents('form');
                    if(frm && frm.length){
                        frm.submit();
                    }
                }
            }
            return false;
        });

        $($this.steps).bind("click", function(e){
            if($this.steps.index(this) == $this.curStepIdx){
                return false;
            }
            var nextStepIdx = $this.steps.index(this);
            var isDone = $this.steps.eq(nextStepIdx).attr("isDone") - 0;
            if(isDone == 1){
                _loadContent($this, nextStepIdx);
            }
            return false;
        });

        // Enable keyboard navigation
        if($this.options.keyNavigation){
            $(document).keyup(function(e){
                if(e.which==39){ // Right Arrow
                    $this.goForward();
                }else if(e.which==37){ // Left Arrow
                    $this.goBackward();
                }
            });
        }
        //  Prepare the steps
        _prepareSteps($this);
        // Show the first slected step
        _loadContent($this,curStepIdx);
    };

    var _prepareSteps = function($this) {
        if(! $this.options.enableAllSteps){
            $($this.steps, $this.target).removeClass("selected").removeClass("done").addClass("disabled");
            $($this.steps, $this.target).attr("isDone",0);
        }else{
            $($this.steps, $this.target).removeClass("selected").removeClass("disabled").addClass("done");
            $($this.steps, $this.target).attr("isDone",1);
        }

        $($this.steps, $this.target).each(function(i){
            $($(this).attr("href"), $this.target).hide();
            $(this).attr("rel",i+1);
        });
    };

    var _loadContent = function($this, stepIdx) {
        var selStep = $this.steps.eq(stepIdx);
        var ajaxurl = $this.options.contentURL;
        var hasContent = selStep.data('hasContent');
        var stepNum = stepIdx+1;
        if (ajaxurl && ajaxurl.length>0) {
            if ($this.options.contentCache && hasContent) {
                _showStep($this, stepIdx);
            } else {
                $.ajax({
                    url: ajaxurl,
                    type: "POST",
                    data: ({step_number : stepNum}),
                    dataType: "text",
                    beforeSend: function(){
                        $this.loader.show();
                    },
                    error: function(){
                        $this.loader.hide();
                    },
                    success: function(res){
                        $this.loader.hide();
                        if(res && res.length>0){
                            selStep.data('hasContent',true);
                            $($(selStep, $this.target).attr("href"), $this).html(res);
                            _showStep($this, stepIdx);
                        }
                    }
                });
            }
        }else{
            _showStep($this,stepIdx);
        }
    };

    var _showStep = function($this, stepIdx) {
        var selStep = $this.steps.eq(stepIdx);
        var curStep = $this.steps.eq($this.curStepIdx);
        if(stepIdx != $this.curStepIdx){
            if($.isFunction($this.options.onLeaveStep)) {
                var context = { fromStep: $this.curStepIdx+1, toStep: stepIdx+1 };
                if (! $this.options.onLeaveStep.call($this,$(curStep), context)){
                    return false;
                }
            }
        }
        $this.elmStepContainer.height($($(selStep, $this.target).attr("href"), $this.target).outerHeight());
        if ($this.options.transitionEffect == 'slide'){
            $($(curStep, $this.target).attr("href"), $this.target).slideUp("fast",function(e){
                $($(selStep, $this.target).attr("href"), $this.target).slideDown("fast");
                $this.curStepIdx =  stepIdx;
                _setupStep(curStep,selStep);
            });
        } else if ($this.options.transitionEffect == 'fade'){
            $($(curStep, $this.target).attr("href"), $this.target).fadeOut("fast",function(e){
                $($(selStep, $this.target).attr("href"), $this.target).fadeIn("fast");
                $this.curStepIdx =  stepIdx;
                _setupStep(curStep,selStep);
            });
        } else if ($this.options.transitionEffect == 'slideleft'){
            var nextElmLeft = 0;
            var nextElmLeft1 = null;
            var nextElmLeft = null;
            var curElementLeft = 0;
            if(stepIdx > $this.curStepIdx){
                nextElmLeft1 = $this.contentWidth + 10;
                nextElmLeft2 = 0;
                curElementLeft = 0 - $($(curStep, $this.target).attr("href"), $this.target).outerWidth();
            } else {
                nextElmLeft1 = 0 - $($(selStep, $this.target).attr("href"), $this.target).outerWidth() + 20;
                nextElmLeft2 = 0;
                curElementLeft = 10 + $($(curStep, $this.target).attr("href"), $this.target).outerWidth();
            }
            if (stepIdx == $this.curStepIdx) {
                nextElmLeft1 = $($(selStep, $this.target).attr("href"), $this.target).outerWidth() + 20;
                nextElmLeft2 = 0;
                curElementLeft = 0 - $($(curStep, $this.target).attr("href"), $this.target).outerWidth();
            } else {
                $($(curStep, $this.target).attr("href"), $this.target).animate({left:curElementLeft},"fast",function(e){
                $($(curStep, $this.target).attr("href"), $this.target).hide();
                });
            }

            $($(selStep, $this.target).attr("href"), $this.target).css("left",nextElmLeft1);
            $($(selStep, $this.target).attr("href"), $this.target).show();
            $($(selStep, $this.target).attr("href"), $this.target).animate({left:nextElmLeft2},"fast",function(e){
                curStepIdx =  stepIdx;
                _setupStep(curStep,selStep);
            });
        } else {
        $($(curStep, obj).attr("href"), obj).hide();
        $($(selStep, obj).attr("href"), obj).show();
        curStepIdx =  stepIdx;
        SetupStep(curStep,selStep);
        }
        return true;
    };

    _init(this, target,options);
};


    var methods = {
        showMessage : function(msg) {
            var msgBox = $(this).data('smartWizard').msgBox;
            $('.content',msgBox).html(msg);
            msgBox.show();
            showMessage(msg);
            return true;
        },
        setError : function(args) {
                function setError(stepnum,iserror){
                  if(iserror){
                    $(steps.eq(stepnum-1), obj).addClass('error')
                  }else{
                    $(steps.eq(stepnum-1), obj).removeClass("error");
                  }
                }
                  var ar =  Array.prototype.slice.call( args, 1 );
                  setError(ar[0].stepnum,ar[0].iserror);
                  return true;
    };

    $.fn.smartWizard = function(method) {
        return this.each(function() {
            var wiz = $(this).data('smartWizard');
            if (typeof method == 'object' || ! method || ! wiz) {
                var options = $.extend({}, $.fn.smartWizard.defaults, method || {});
                if (! wiz) {
                    wiz = new SmartWizard($(this), options);
                    $(this).data('smartWizard', wiz);
                }
            } else {
                if (SmartWizard.prototype[method] == "function") {
                    return this[method].apply(this, Array.prototype.slice.call(arguments, 1));
                } else {
                    $.error('Method ' + method + ' does not exist on jQuery.smartWizard');
                }
            }
        });
    };

    // Default Properties and Events
    $.fn.smartWizard.defaults = {
        selected: 0,  // Selected Step, 0 = first step
        keyNavigation: true, // Enable/Disable key navigation(left and right keys are used if enabled)
        enableAllSteps: false,
        transitionEffect: 'fade', // Effect on navigation, none/fade/slide/slideleft
        contentURL:null, // content url, Enables Ajax content loading
        contentCache:true, // cache step contents, if false content is fetched always from ajax url
        cycleSteps: false, // cycle step navigation
        enableFinishButton: false, // make finish button enabled always
        errorSteps:[],    // Array Steps with errors
        labelNext:'Next',
        labelPrevious:'Previous',
        labelFinish:'Finish',
        onLeaveStep: null, // triggers when leaving a step
        onShowStep: null,  // triggers when showing a step
        onFinish: null  // triggers when Finish button is clicked
    };
})(jQuery);


(function($){
    $.fn.smartWizard = function(action) {
        var options = $.extend({}, $.fn.smartWizard.defaults, action);
        var args = arguments;

        return this.each(function(){


                function showStep(stepIdx){
                }

                function SetupStep(curStep,selStep){
                   $(curStep, obj).removeClass("selected");
                   $(curStep, obj).addClass("done");

                   $(selStep, obj).removeClass("disabled");
                   $(selStep, obj).removeClass("done");
                   $(selStep, obj).addClass("selected");
                   $(selStep, obj).attr("isDone",1);
                   adjustButton();
                   if($.isFunction(options.onShowStep)) {
                      var context = { fromStep: $(curStep).attr('rel'), toStep: $(selStep).attr('rel') };
                      if(!options.onShowStep.call(this,$(selStep),context)){
                        return false;
                      }
                   }
                }

                function goForward(){
                  var nextStepIdx = curStepIdx + 1;
                  if(steps.length <= nextStepIdx){
                    if(!options.cycleSteps){
                      return false;
                    }
                    nextStepIdx = 0;
                  }
                  LoadContent(nextStepIdx);
                }

                function goBackward(){
                  var nextStepIdx = curStepIdx-1;
                  if(0 > nextStepIdx){
                    if(!options.cycleSteps){
                      return false;
                    }
                    nextStepIdx = steps.length - 1;
                  }
                  LoadContent(nextStepIdx);
                }

                function adjustButton(){
                  if(!options.cycleSteps){
                    if(0 >= curStepIdx){
                      $(btPrevious).addClass("buttonDisabled");
                    }else{
                      $(btPrevious).removeClass("buttonDisabled");
                    }
                    if((steps.length-1) <= curStepIdx){
                      $(btNext).addClass("buttonDisabled");
                    }else{
                      $(btNext).removeClass("buttonDisabled");
                    }
                  }
                  // Finish Button
                  if(!steps.hasClass('disabled') || options.enableFinishButton){
                    $(btFinish).removeClass("buttonDisabled");
                  }else{
                    $(btFinish).addClass("buttonDisabled");
                  }
                }

                function showMessage(msg){
                }

                function setError(stepnum,iserror){
                  if(iserror){
                    $(steps.eq(stepnum-1), obj).addClass('error')
                  }else{
                    $(steps.eq(stepnum-1), obj).removeClass("error");
                  }
                }
        });
    };

})(jQuery);
