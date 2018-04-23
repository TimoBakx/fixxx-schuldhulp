!function(w, d){
  
  var handlers = {

    'toggle': function(e) {
      var el = document.getElementById(this.hash.substr(1));
      if (el) {
        e.preventDefault();
        var 
          wasActive = this.hash == w.location.hash || el.classList.contains('active'),
          addRemove = wasActive ? 'remove' : 'add',
          tabs = container = _closest(this, '.tabs');

        if (tabs && !wasActive) {
          var els = tabs.querySelectorAll('.active');
          for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('active');
          }
          
        }
        
        el.classList[addRemove]('active');
        this.classList[addRemove]('active');
        var url = document.location.href.split('#')[0];
        if (history.replaceState) {
          w.location.hash = '_';
          history.replaceState({id: url}, d.title, wasActive ? url : url + this.hash);
        }
        
      }
    },
    
    'scroll': function(e){
      var target = document.getElementById(this.hash.substr(1));
      if (!target) return;
      e.preventDefault();
      _scrollTo(target);
    },
    
    'multistatus': function(e){
      e.preventDefault();
      var 
        values = this.hash.substr(1).split(','),
        form = _closest(this, 'form');
      
      
      var els = form.querySelectorAll('.active');
      for (var i = 0; i < els.length; i++) {
        els[i].classList.remove('active');
      }
      
      if (history.replaceState) {
        w.location.hash = '_';
        var url = document.location.href.split('#')[0];
        history.replaceState({id: url}, d.title, url);
      }
      
      this.classList.add('active');
      
      var els = form.querySelectorAll('#search_dossier_form_status input');
      for (var i = 0; i < els.length; i++) {
        els[i].checked = false;
      }
      
      
      for (var i = 0; i < values.length; i++) {
        var el = form.querySelector('input[value="' + values[i] + '"]');
        if (el) {
          el.checked = true;
        }
      }
      
      helpers.trigger(form, 'submit');
      
    },
    
    'add-file': function(e){
      e && e.preventDefault();
      
      var 
        files = _closest(this, '.files-container'),
        counter = files.dataset.counter || -1,
        prototype = files.querySelector('.prototype').cloneNode(true);

      counter++;
      
      prototype.classList.remove('prototype');
      prototype.setAttribute('data-name', prototype.getAttribute('data-name').replace('__name__', 'n' + counter));
      prototype.querySelector('input[type="text"]').setAttribute('name', prototype.querySelector('input[type="text"]').getAttribute('name').replace('__name__', 'n' + counter));
      prototype.querySelector('input[type="file"]').setAttribute('name', prototype.querySelector('input[type="file"]').getAttribute('name').replace('__name__', 'n' + counter));
      
      prototype.classList.add('active');
      
      files.insertBefore(prototype, this);
    
      // window.schuldhulp.pdfSplitter.dragula.containers.push(prototype.querySelector('.drop-area'));
    
      prototype.addEventListener('filled', function (event) {
          var elm = prototype.querySelector('input[type="text"]');
          if (elm.value === '' || elm.value === null) {
              elm.value = prototype.parentNode.getAttribute('data-default-document-naam') + ' ' + (counter + 1 + files.parentNode.querySelectorAll('.bestanden .bestand').length);
              elm.focus();
          }
      });
    
      prototype.querySelector('input[type="file"]').addEventListener('change', function (event) {
          if (event.target.value) {
              if (prototype.querySelector('.drop-area')) {
                  prototype.removeChild(prototype.querySelector('.drop-area'));
              }
              prototype.classList.add('files-only');
              var button = prototype.querySelector('.file');
              button.textContent = event.target.value.replace('/', '\\').split('\\').pop();
            
              var event = new Event('filled');
              prototype.dispatchEvent(event);
          }
      });
      
      prototype.querySelector('input[type="text"]').addEventListener('keydown', function(e){
        if (e && e.keyCode == 13) {
          e.preventDefault();
        }
      });
    
      files.dataset.counter = counter;
      
      return prototype;
    },
    
    'bestand': function(e){
      if (window.schuldhulp && window.schuldhulp.quickViewer) {
        e && e.preventDefault();
        window.schuldhulp.quickViewer.showDocument(this);
      }
    }
    
  };
  
  var decorators = {
    
    'droppable': function(){
      var
        container = this;
      var currentZone;
      
      var _reset = function(e){
        e.preventDefault();
        e.stopPropagation();
      }
      var _over = function(e){
        
        var zone = (e && e.target) && _closest(e.target, '.accordion');
        var fileContainer = (e && e.target) && _closest(e.target, '.file-container');
        
        if (fileContainer) {
          var els = d.querySelectorAll('.file-container.drop-over');
          for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('drop-over');
          }
          fileContainer.classList.add('drop-over');
        }
        
        
        if (!zone) return;
        if (currentZone != zone) {
          if (currentZone) currentZone.classList.remove('drop-over');
          currentZone = zone;
          zone.classList.add('drop-over');
        }
      };
      var _out = function(e){
      };
      var _drop = function(e){
        if (currentZone) {
          currentZone.classList.remove('drop-over');
          currentZone = false;
        }
        
        var els = d.querySelectorAll('.drop-over');
        for (var i = 0; i < els.length; i++) {
          els[i].classList.remove('drop-over');
        }
        
        if (d.classList.contains('sort-mode')) return;
        
        var files = e.dataTransfer.files;
        var zone = (e && e.target) && _closest(e.target, '.accordion');
        var form = (e && e.target) && _closest(e.target, 'form');
        var changer = (e && e.target) && _closest(e.target, '[data-changer]');
        
        if (!files) return;
        
        zone.classList.add('active');
        
        if (form) {
          
          // create new file zone
          for (var i=0; i<files.length; i++) {
            var addButton = zone.querySelector('.files-container .add.bestand');
            if (addButton) {
              var 
                file = handlers['add-file'].call(addButton),
                input = file.querySelector('[type="file"]'),
                button = file.querySelector('.file'),
                icon = file.querySelector('[data-extension]');
            
              button.textContent = files[i].name.replace('/', '\\').split('\\').pop();
              // icon.dataset.extension = files[i].type.split('/').pop();
            
              var event = new Event('filled');
              file.dispatchEvent(event);
            
              form.files = form.files || [];
              form.files.push({
                'name': input.name,
                'file': files[i]
              });
              input.parentNode.removeChild(input);
              
              file.classList.add('has-file');
              
            }
          
          }
        }
        
        changer && changers[changer.dataset.changer].call(changer, e);
        
      };
      
      if (!w.dropReset) {
        w.addEventListener('drop', _reset);
        w.addEventListener('dragover', _reset);
        w.dropReset = true;
      }

      var events = 'dragenter dropstart'.split(' ');
      for (var i = 0; i < events.length; i++) {
        this.addEventListener(events[i], _over);
      }

      var events = 'dragleave dropend  drop'.split(' ');
      for (var i = 0; i < events.length; i++) {
        this.addEventListener(events[i], _out);
      }

      this.addEventListener('drop', _drop);

    },
    
    
  };
  
  var submitters = {
    
    'save': function(e){
      var 
        form = this;
        
      e && e.preventDefault();
      if (form.request) form.request.abort();
      
      form.classList.add('in-progress');
    
      var data = new FormData(form);
      
      var url = form.action + '?v' + (new Date()).getTime();
      
      if (form.method.toLowerCase() == 'get') {
        url += '&' + _serialize(form);
        data = {};
      };
      
      var els = form.querySelectorAll('.file-pdf-pages');
      
      for (var i = 0; i < els.length; i++) {
        var pages = els[i].querySelectorAll('.page canvas');
        if (pages.length > 0) {
          var pdf = new jsPDF('portrait', 'mm', 'a4');
          for (var j = 0; j < pages.length; j++) {
            if (j>0) {
              pdf.addPage();
            }
  
            var img = pages[j].toDataURL("image/jpeg");
            pdf.addImage(img, 'JPEG', 0, 0, 210, 297);

          }
          data.append(els[i].dataset.name, pdf.output('blob'), 'document.pdf');
        }
        
      }
      
      
      if (form.files) {
        for (var i=0; i< form.files.length; i++) {
          data.append(form.files[i].name, form.files[i].file);
        }
      }
      form.files = [];
      
      var _process = function(data, selector) {
        var div = document.createElement('div');
        div.innerHTML = data;
      
        var 
          result = div.querySelectorAll(selector),
          target = d.querySelectorAll(selector);

        if (result && target) {
          for (var i=0; i< target.length; i++) {
            target[i].innerHTML = result[i].innerHTML;
          }
        }
      
        form.classList.remove('in-progress');
        form.classList.remove('form-changed');
      };
      
      form.request = helpers.ajax({
        type: form.method,
        url: url,
        data: data,
        callback: function(data){
          
          if (form.dataset.resultSelector && form.dataset.resultSelector.indexOf('REFRESH') === 0) {
            if (form.dataset.resultSelector == 'REFRESH') {
              w.location.href = w.location.href.split('#')[0];
            } else {
              helpers.ajax({
                type: 'get',
                url: w.location.href,
                callback: function(data){
                  _process(data, form.dataset.resultSelector.substring(8));
                  w.location.hash = '';
                }
              });
            }
          } else {
            _process(data, form.dataset.resultSelector);
          }

        },
        error: function(){
          form.classList.remove('in-progress');
          form.classList.add('ajax-error');
        }
      });
      
    },
    
    'zeker-weten': function(e){
      if (!confirm(this.dataset.copy ? this.dataset.copy : 'Weet je het zeker?')) {
        e.preventDefault();
      }
    }
    
  };
  
  var changers = {
    'change': function(){
      var 
        form = this;
        
        
      form.classList.add('form-changed');
      
      if (!form.changed) {
        form.changed = true;
        w.onbeforeunload = function() {
          if (d.querySelectorAll('.form-changed').length) {
            return 'Je hebt nog niet opgeslagen wijzigingen. Deze zullen verloren gaan als je niet eerst je wijzigingen opslaat';
          }
        }
      }

    },
    
    'pdfsplitter': function(e){
      var 
        container = this,
        pages = container.querySelector('.pages'),
        file = (e && e.dataTransfer && e.dataTransfer.files[0]) || this.querySelector('[name="file"]').files[0];
        
      
      container.classList.add('active');
      
      blob = window.URL.createObjectURL(file);
      
      var _clear = function(){
        var els = pages.querySelectorAll('.page');
        for (var i = 0; i < els.length; i ++) {
          els[i].parentNode.removeChild(els[i]);
        }
      };
      
      var _load = function(){
        PDFJS.getDocument(blob).then(function(pdf) {
          for (var i = 1; i <= pdf.numPages; i += 1) {
            pdf.getPage(i).then(function (pdfPage){ 
              _thumb(pdfPage); 
            });
          }
        });
      };
      
      var _thumb = function(pdfPage){
        var scale = 3;
        
        var thumb = document.createElement('div');
        thumb.classList.add('page');
        thumb.setAttribute('data-page-index', pdfPage.pageIndex);
        pages.appendChild(thumb);

        var canvas = document.createElement('canvas');
        canvas.classList.add('upload-as-pdf');
        var context = canvas.getContext('2d');
        var viewport = pdfPage.getViewport(scale);
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        var renderContext = {canvasContext: context, viewport: viewport};
        pdfPage.render(renderContext);

        thumb.appendChild(canvas);
        
      };
      
      
      _clear();
      _load();
      
      if (!container.sortable && Sortable) {
        container.sortable = Sortable.create(pages, {
          filter: '.page-delete',
          animation: 150,
          sort: false,
          scroll: true,
          scrollSensitivity: 30,
          scrollSpeed: 10,
          onStart: function(){
            d.classList.add('sort-mode');
          },
          onEnd: function(e){

            var 
              zone = _closest(e.originalEvent.target, '.accordion'),
              changer = _closest(e.originalEvent.target, '[data-changer]'),
              file = _closest(e.originalEvent.target, '.file-container.active:not(.has-file)'),
              dropZone = false;
            
            if (zone) {
              
              if (zone.classList.contains('pdf-splitter')) return;
              
              zone.classList.add('active');
              
              var lastFile = file ? [file] : zone.querySelectorAll('.file-container.active:not(.has-file)')
              
              if (!lastFile.length) {
                var addButton = zone.querySelector('.files-container .add.bestand');
                lastFile = handlers['add-file'].call(addButton);

              } else {
                lastFile = lastFile[(lastFile.length - 1)];
              }
              
              var label = lastFile.querySelector('label');
              if (label) label.parentNode.removeChild(label);
              
              var icon = lastFile.querySelector('[data-extension]');
              if (icon) icon.dataset.extension = 'pdf';
              
              lastFile.classList.add('file-pdf-pages');
              
              var event = new Event('filled');
              lastFile.dispatchEvent(event);
              

              dropZone = lastFile.querySelector('.drop-area');
              
              e.item.classList.add('dragged');
              
              var original = e.item.querySelector('canvas');

              var canvas = document.createElement('canvas');
              var context = canvas.getContext('2d');
              canvas.width = original.width;
              canvas.height = original.height;
              context.drawImage(original, 0, 0);
              var page = document.createElement('div');
              page.classList.add('page');
              page.appendChild(canvas);
              
              dropZone.appendChild(page);
              
              changer && changers[changer.dataset.changer].call(changer, e.originalEvent);
              
              if (!dropZone.sortable) {
                dropZone.sortable = Sortable.create(dropZone, {
                  group: 'files'
                });
              }
              
            }
            
            d.classList.remove('sort-mode');
          }

       
        });
      }
      
      
    },
    
    'address': function(){
      var 
        select = this.querySelector('select'),
        fields = ['bedrijfsnaam', 'rekening', 'allegro-code', 'straat', 'huisnummer', 'postcode', 'plaats', 'opmerkingen'],
        template = '<strong>__bedrijfsnaam__ (__allegro-code__)</strong><br>__rekening__<br>__straat__ __huisnummer__<br>__postcode__ __plaats__<br>__opmerkingen__',
        widget = _closest(select, '.label-widget'),
        helper = widget.querySelector('.address-helper'),
        form = _closest(this, 'form');
      
      if (!helper) {
        helper = document.createElement('em');
        helper.classList.add('address-helper');
        widget.appendChild(helper);
      }
      
      helper.innerHTML = '';
      
      var selected = select.options[select.selectedIndex];
      
      if (selected) {
        for (var i = 0; i < fields.length; i++) {
          var v = selected.getAttribute('data-' + fields[i]);
          if (!v) v = '';
          template = template.replace('__' + fields[i] + '__', v);
        }

        template = template.replace('()','');
        helper.innerHTML = template;
        
      }
      
      helpers.trigger(form, 'change');
      
      
    },
    
    'status': function(e){
      var 
        active = _closest(this, '.accordion.active'),
        form = (e && e.target) && _closest(e.target, 'form');
      
      if (active) {
        active.classList.remove('active');
        var trigger = active.querySelector('.naam a.active');
        trigger.classList.remove('active');
        var url = document.location.href.split('#')[0];
        if (history.replaceState) {
          w.location.hash = '_';
          history.replaceState({id: url}, d.title, url);
        }
      }
      
      form && changers[form.dataset.changer].call(form, e);
      
    }
    
  };
  
  var keyuppers = {
    'change': function(e){
      // changers['change'] && changers['change'].call(this, e);
    },
    
    'select': function(e){
      var 
        container = this;

      if (!container.select) {
        container.form = _closest(container, 'form');
        container.select = container.querySelector('select');
        container.clone = container.select.cloneNode(true);
        container.options = container.clone.querySelectorAll('option');
        container.input = container.querySelector('input');
      }


      
      if (e.keyCode == 38 || e.keyCode == 40) {
        var index = Math.min(container.select.options.length-1, Math.max(0, container.select.selectedIndex + (e.keyCode == 38 ? -1 : +1)));
        container.select.options[index].selected = true;
        e.preventDefault();
      } else {
        
        container.select.innerHTML = '';
        val = container.input.value.trim();

        if (val.length === 0) {
          container.select.innerHTML = container.clone.innerHTML;
        } else {
          var reg = new RegExp((val.length === 1 ? '^' : '') + val, 'i');
          for (var i = 0; i < container.options.length; i++) {
            if (container.options[i].value != '') {
              var string = container.options[i].textContent;
              for (var k = 0; k < container.options[i].attributes.length; k++) {
                if (/^data-/.test(container.options[i].attributes[k].nodeName)) {
                  string += ' ' + container.options[i].attributes[k].nodeValue;
                }
              }
            
              if (string.match(reg)) {
                container.select.appendChild(container.options[i].cloneNode(true));
              }
            }
          }
        
          var option = document.createElement('option');
          option.value = '';
          container.select.appendChild(option);
        
        }
      }  
      
      helpers.trigger(container.select, 'change');
    }
    
  };
  
  var helpers = {
    ajax: function(options) {
      var request = new XMLHttpRequest();
      request.open(options.type, options.url, true);
      request.onreadystatechange = function () {
        if (request.readyState == 4) {
          if (request.status >= 200 && request.status < 400) {
            if (options.callback && typeof (options.callback) == 'function') {
              options.callback.call(request, request.responseText);
            }
          } else {
            if (options.error && typeof (options.error) == 'function') {
              options.error.call(request, request.responseText);
            }
          }
        }
      };

      request.send(options.data);
      
      return request;
    },
    
    'trigger': function(el, eventType){
      var e = document.createEvent('MouseEvents');
      e.initMouseEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      el.dispatchEvent(e);
    }
    
  };
  
  if (w.location.hash) {
    var 
      el = document.querySelector('.document ' + w.location.hash),
      trigger = document.querySelector('[data-handler*="toggle"][href^="' + w.location.hash + '"]');
    
    if (el) {
      
      if (trigger) {
        trigger.classList.add('active');
        el.classList.add('active');
      }

      setTimeout(function(){
        w.scrollTo(0,0);
        setTimeout(function(){
          _scrollTo(el);
        }, 800);
      },1);
    }
  }
  
  
  d.addEventListener('click',function(t){var k,e,a=t&&t.target;if(a=_closest(a,'[data-handler]')){var r=a.getAttribute('data-handler').split(/\s+/);if('A'==a.tagName&&(t.metaKey||t.shiftKey||t.ctrlKey||t.altKey))return;for(e=0;e<r.length;e++){k=r[e].split(/[\(\)]/);handlers[k[0]]&&handlers[k[0]].call(a,t,k[1])}}});
  
  var l = { 
    submit: 'submitter', 
    change: 'changer', 
    keyup: 'keyupper'
  }
  for (var i in l){
    l.hasOwnProperty(i) && d.addEventListener(i,function(t){var s=t.type,o=eval(l[s]+'s'),k,e,f=t&&t.target;if(f=_closest(f,'[data-'+l[s]+']')){var r=f.getAttribute('data-'+l[s]).split(/\s+/);for(e=0;e<r.length;e++){k=r[e].split(/[\(\)]/);o&&o[k[0]]&&o[k[0]].call(f,t,k[1])}}});
  }  
  
  var scrollers=[];w.addEventListener('scroll',function(){requestAnimationFrame(function(){for(var l=0;l<scrollers.length;l++)scrollers[l].el&&scrollers[l].fn.call(scrollers[l].el)})},!1);
  
  var _scrollTo=function(n,o){var e,i=window.pageYOffset,t=window.pageYOffset+n.getBoundingClientRect().top,r=(document.body.scrollHeight-t<window.innerHeight?document.body.scrollHeight-window.innerHeight:t)-i,w=function(n){return n<.5?4*n*n*n:(n-1)*(2*n-2)*(2*n-2)+1},o=o||1e3;r&&window.requestAnimationFrame(function n(t){e||(e=t);var d=t-e,a=Math.min(d/o,1);a=w(a),window.scrollTo(0,i+r*a),d<o&&window.requestAnimationFrame(n)})};

  var _decorate = function(){var k,i,j,decoratorString,el,els=d.querySelectorAll('[data-decorator]');for(i=0;i<els.length;i++){for(decoratorString=(el=els[i]).getAttribute('data-decorator').split(/\s+/),j=0;j<decoratorString.length;j++){k=decoratorString[j].split(/[\(\)]/);decorators[k[0]]&&decorators[k[0]].call(el,k[1]);el.removeAttribute('data-decorator')}}};

  var _closest=function(e,t){var ms='MatchesSelector',c;['matches','webkit'+ms,'moz'+ms,'ms'+ms,'o'+ms].some(function(e){return'function'==typeof document.body[e]&&(c=e,!0)});var r=e;try{for(;e;){if(r&&r[c](t))return r;e=r=e.parentElement}}catch(e){}return null};
  
  function _serialize(form){if(!form||form.nodeName!=="FORM"){return }var i,j,q=[];for(i=form.elements.length-1;i>=0;i=i-1){if(form.elements[i].name===""){continue}switch(form.elements[i].nodeName){case"INPUT":switch(form.elements[i].type){case"text":case"hidden":case"password":case"button":case"reset":case"submit":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"checkbox":case"radio":if(form.elements[i].checked){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value))}break;case"file":break}break;case"TEXTAREA":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"SELECT":switch(form.elements[i].type){case"select-one":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"select-multiple":for(j=form.elements[i].options.length-1;j>=0;j=j-1){if(form.elements[i].options[j].selected){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].options[j].value))}}break}break;case"BUTTON":switch(form.elements[i].type){case"reset":case"submit":case"button":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break}break}}return q.join("&")};
  
  _decorate();

}(window, document.documentElement);