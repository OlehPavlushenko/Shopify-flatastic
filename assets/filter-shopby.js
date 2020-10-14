(function($) {
  $(document).ready(function() {
    vision.init();
  });

  if ($(".block-layered-nav")) {
    History.Adapter.bind(window, 'statechange', function() {
      var State = History.getState();
      if (!vision.isFilterAjaxClick) {
        vision.shopifyParam();
        var newurl = vision.sidebarCreateUrl();
        vision.ajaxGetContent(newurl);
        vision.reActivateSidebar();
      }
      vision.isFilterAjaxClick = false;
    });
  }

  var vision = {
    isFilterAjaxClick: false,
    loadingtimeout: null,
    init: function() {
      this.shopifyParam();
      this.initSidebar();

      $('.filter-tags dd > ol').each(function() {
        if (!$(this).children().length) {
          $(this).parents('dd').css('display', 'none');
          $(this).parents('dd').prev().css('display', 'none');
        }
      });
      if((!$('.filter-color > ol').children().length) && (!$('.filters-tags > ol').children().length) && (!$('.filters-price > ol').children().length)) {
        $('.widget-filter').css('display', 'none');
      }
    },
    initSidebar: function() {
      if ($(".block-layered-nav").length > 0) {
        vision.typeEvents();
        vision.filterClear();
      }
    },
    shopifyParam: function() {
      Shopify.queryParams = {};
      if (location.search.length) {
        for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
          aKeyValue = aCouples[i].split('=');
          if (aKeyValue.length > 1) {
            Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
          }
        }
      }
    },
    initSortbyEvent: function() {
      $(document).on('change', '.filters-toolbar .filters-toolbar__input--sort', function(e) {
        Shopify.queryParams.sort_by = $(this).val();
        vision.ajaxClick();
        $(".filters-toolbar__input--sort option[value='"+$(this).val()+"']").attr("selected","selected");
        e.preventDefault();
      });
    },
    initCountProduct: function() {
      
    },
    sidebarCreateUrl: function(baseLink) {
      var newQuery = $.param(Shopify.queryParams).replace(/%2B/g, '+');
      if (baseLink) {
        if (newQuery != "")
          return baseLink + "?" + newQuery;
        else
          return baseLink;
      }
      return location.pathname + "?" + newQuery;
    },
    typeEvents: function() {
      vision.filterByTags();
      vision.initSortbyEvent();
      vision.initCountProduct();
    },
    filterByTags: function() {
      $('.filter-tags dd ol li a:not(".clear"), .filter-tags dd ol li label').click(function(e) {
        var currentTags = [];
        if (Shopify.queryParams.constraint) {
          currentTags = Shopify.queryParams.constraint.split('+');
        }

        if (!window.enable_sidebar_multiple_choice && !$(this).prev().is(":checked")) {
          var otherTag = $(this).parent('.filter-tags').find("input:checked");
          if (otherTag.length > 0) {
            var tagName = otherTag.val();
            if (tagName) {
              var tagPos = currentTags.indexOf(tagName);
              if (tagPos >= 0) {
                currentTags.splice(tagPos, 1);
              }
            }
          }
        }

        var tagName = $(this).prev().val();
        if (tagName) {
          var tagPos = currentTags.indexOf(tagName);
          if (tagPos >= 0) {
            currentTags.splice(tagPos, 1);
          } else {
            currentTags.push(tagName);
          }
        }
        if (currentTags.length) {
          Shopify.queryParams.constraint = currentTags.join('+');
        } else {
          delete Shopify.queryParams.constraint;
        }
        vision.ajaxClick();
        e.preventDefault();
      });
    },
    ajaxClick: function(baseLink) {
      delete Shopify.queryParams.page;
      var newurl = vision.sidebarCreateUrl(baseLink);
      vision.isFilterAjaxClick = true;
      History.pushState({
        param: Shopify.queryParams
      }, newurl, newurl);
      vision.ajaxGetContent(newurl);
    },
    ajaxGetContent: function(newurl) {
      $.ajax({
        type: 'get',
        url: newurl,
        beforeSend: function() {
          vision.showLoading();
        },
        success: function(data) {
          vision.hideLoading();
          vision.pageData(data);
          vision.filterByTags();
          vision.filterClear();
		  
          $('.filter-tags dd > ol').each(function() {
            if (!$(this).children().length) {
              $(this).parents('dd').css('display', 'none');
              $(this).parents('dd').prev().css('display', 'none');
            }
          })
        },
        error: function(xhr, text) {
          vision.hideLoading();
        }
      });
    },
    pageData: function(data) {
      var current_class = $(".main_content .grid-uniform");
      var content = $(data).find(".main_content .grid-uniform-prod");
      current_class.html(content);
      //ajaxify();
      var countprod = $(data).find('.grid-uniform-prod').attr("data-count");
       $('.collection_products span').text(countprod);

       Currency.convertAll(window.shop_currency, $('select[name=currencies] option:selected').val(), '.price-container span.money', 'money_format');
      if (theme.settings.cartType === 'drawer') {
        ajaxCart.init({
          moneyFormat: theme.strings.moneyFormat
        });
      }
      $('.product_item').each(function(){
        var self = $(this)
        if ( device.desktop() && self.find("#prod-img2").length > 0 ) {
          self.on({
            mouseenter: function(){
              self.find("#prod-img1").stop().animate({"opacity": 0}, 200);
              self.find("#prod-img2").stop().animate({"opacity": 1}, 200);
            },
            mouseleave: function(){
              self.find("#prod-img1").stop().animate({"opacity": 1}, 200);
              self.find("#prod-img2").stop().animate({"opacity": 0}, 200);
            }
          });
        }     
      });
      if ($('.CollectionSection').hasClass('lists')) {
        $('#CollectionSection .grid-uniform .grid-uniform-prod').find('.grid__item').addClass('large--one-half');
      }
      $(function() {
        $('#CollectionSection div.grid-product').each(function() {        
          var tip = $(this).find('div.count_holder_small'); 

          $(this).hover(
              function() { tip.appendTo('body'); },
              function() { tip.appendTo(this); }
          ).mousemove(function(e) {
              var x = e.pageX + 60,
                  y = e.pageY - 50,
                  w = tip.width(),
                  h = tip.height(),
                  dx = $(window).width() - (x + w),
                  dy = $(window).height() - (y + h);

              if ( dx < 50 ) x = e.pageX - w - 60;
              if ( dy < 50 ) y = e.pageY - h + 130;

              tip.css({ left: x, top: y });
            });         
        });
      });
      if (Shopify.queryParams.sort_by) {
        var sortValue = Shopify.queryParams.sort_by;
        $(".filters-toolbar__input--sort option[value='"+sortValue+"']").attr("selected","selected");
      }

      //replace tags
      $(".filter-tags").replaceWith($(data).find(".filter-tags"));

      //product review
      if ($(".spr-badge").length > 0) {
        return window.SPR.registerCallbacks(), window.SPR.initRatingHandler(), window.SPR.initDomEls(), window.SPR.loadProducts(), window.SPR.loadBadges();
      }
    },

    filterClear: function() {
      $(".filter-tags dd ol li").each(function() {
        var sidebarTag = $(this);
        if (sidebarTag.find("input:checked").length > 0) {
          //has active tag
          sidebarTag.parent().parent().prev().find(".clear").show().click(function(e) {
            var currentTags = [];
            if (Shopify.queryParams.constraint) {
              currentTags = Shopify.queryParams.constraint.split('+');
            }
            sidebarTag.find("input:checked").each(function() {
              var selectedTag = $(this);
              var tagName = selectedTag.val();
              if (tagName) {
                var tagPos = currentTags.indexOf(tagName);
                if (tagPos >= 0) {
                  //remove tag
                  currentTags.splice(tagPos, 1);
                }
              }
            });
            if (currentTags.length) {
              Shopify.queryParams.constraint = currentTags.join('+');
            } else {
              delete Shopify.queryParams.constraint;
            }
            vision.ajaxClick();
            e.preventDefault();
          });
        }
      });
    },
    reActivateSidebar: function() {
      $(".filter-category .active").removeClass("active");
      $(".filter-tags input:checked").attr("checked", false);

      //category
      var cat = location.pathname.match(/\/collections\/(.*)(\?)?/);
      if (cat && cat[1]) {
        $(".filter-category a[href='" + cat[0] + "']").addClass("active");
      }
    },
    showLoading: function() {
      $('#vsloading').show();
    },
    hideLoading: function() {
      $('#vsloading').hide();
    }
  }
  })(jQuery);