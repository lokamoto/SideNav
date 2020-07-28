/*!
 * Copyright MadCap Software
 * http://www.madcapsoftware.com/
 * Unlicensed use is strictly prohibited
 *
 * v16.0.7426.25547
 */

(function () {
    var isTriPane = MadCap.Utilities.HasRuntimeFileType("TriPane");
    if (!MadCap.Utilities.HasRuntimeFileType("Topic") && !isTriPane)
        return;

    var Topic = MadCap.CreateNamespace("Topic");
    var _HelpSystem = null;

    MadCap.WebHelp.HelpSystem.LoadHelpSystemDefault().done(function (helpSystem) {
        _HelpSystem = helpSystem;

        LoadBreadcrumbs();
        LoadMenus();
        LoadMiniTocs();
        createMCBacklink();
    });

    Topic.Expand = function (el) {
        var control = new TextEffects.ExpandingControl(el.parentNode);

        control.Toggle();
    };

    Topic.DropDown = function (el) {
        var control = new TextEffects.DropDownControl(el.parentNode.parentNode);

        control.Toggle();
    };

    Topic.Toggle = function (el) {
        var control = new TextEffects.TogglerControl(el);

        control.Toggle();
    };

    Topic.ThumbPopup_Click = function (e) {
        var popupEl = Topic.ShowThumbnailPopup(e, this, "click");

        if (e.preventDefault)
            e.preventDefault(); // prevents link from navigating
    };

    Topic.ThumbPopup_Hover = function (e) {
        var popupEl = Topic.ShowThumbnailPopup(e, this, "mouseleave");
    };

    Topic.ShowThumbnailPopup = function (e, aEl, showType) {
        // dismiss any open popups
        $(".MCPopupContainer").trigger('popup:dismiss');

        var CONTAINER_MARGIN = 10;
        var CONTAINER_BORDER_WIDTH = 1;
        var IMAGE_PADDING = 10;
        var thumbEl = $(aEl).children("img")[0];
        var fullImageWidth = parseInt(MadCap.Dom.Dataset(thumbEl, "mcWidth"));
        var fullImageHeight = parseInt(MadCap.Dom.Dataset(thumbEl, "mcHeight"));
        var hwRatio = fullImageHeight / fullImageWidth;

        var maxWidth = document.documentElement.clientWidth - ((CONTAINER_MARGIN + CONTAINER_BORDER_WIDTH + IMAGE_PADDING) * 2);
        var maxHeight = document.documentElement.clientHeight - ((CONTAINER_MARGIN + CONTAINER_BORDER_WIDTH + IMAGE_PADDING) * 2);

        if (fullImageHeight > maxHeight) {
            fullImageHeight = maxHeight;
            fullImageWidth = fullImageHeight / hwRatio;
        }

        if (fullImageWidth > maxWidth) {
            fullImageWidth = maxWidth;
            fullImageHeight = fullImageWidth * hwRatio;
        }

        //

        var thumbTop = $(thumbEl).offset().top;
        var thumbLeft = $(thumbEl).offset().left;

        var fullImageSrc = MadCap.Dom.GetAttribute(aEl, "href");

        var fullImageAlt = MadCap.Dom.GetAttribute(aEl, "data-mc-popup-alt");
        var containerHeight = fullImageHeight + ((CONTAINER_BORDER_WIDTH + IMAGE_PADDING) * 2);
        var containerWidth = fullImageWidth + ((CONTAINER_BORDER_WIDTH + IMAGE_PADDING) * 2);
        var containerTop = (thumbTop + (thumbEl.offsetHeight / 2)) - (containerHeight / 2);
        var containerLeft = (thumbLeft + (thumbEl.offsetWidth / 2)) - (containerWidth / 2);

        // Keep within viewable area

        var scrollPosition = MadCap.Dom.GetScrollPosition();
        var clientTop = scrollPosition.Y;
        var clientBottom = clientTop + document.documentElement.clientHeight;
        var clientLeft = scrollPosition.X;
        var clientRight = clientLeft + document.documentElement.clientWidth;
        var minTop = clientTop + CONTAINER_MARGIN;
        var minLeft = clientLeft + CONTAINER_MARGIN;
        var maxBottom = clientBottom - CONTAINER_MARGIN;
        var maxRight = clientRight - CONTAINER_MARGIN;

        if (containerTop < minTop)
            containerTop = minTop;

        if (containerLeft < minLeft)
            containerLeft = minLeft;

        if (containerTop + containerHeight > maxBottom)
            containerTop = maxBottom - containerHeight;

        if (containerLeft + containerWidth > maxRight)
            containerLeft = maxRight - containerWidth;

        //

        if ($(".title-bar.sticky.is-stuck")) {
            if (containerTop < $(".title-bar.sticky.is-stuck").innerHeight()) {
                containerTop += $(".title-bar.sticky.is-stuck").innerHeight() - containerTop + CONTAINER_MARGIN;
            }
        }

        //

        var $containerEl = $("<div></div>");
        $containerEl.addClass("MCPopupContainer");

        var fullImageEl = document.createElement("img");
        $(fullImageEl).addClass("MCPopupFullImage");
        fullImageEl.setAttribute("src", fullImageSrc);
        fullImageEl.setAttribute("alt", fullImageAlt); // Fix for bug #46031 - HTML5 output
        fullImageEl.setAttribute("tabindex", "0");

        var dismissPopup = function (e) {
            $containerEl.animate(
                {
                    top: topStart,
                    left: leftStart
                }, 200, function () {
                    $containerEl.remove();
                });

            $(fullImageEl).animate(
                {
                    width: thumbEl.offsetWidth,
                    height: thumbEl.offsetHeight
                }, 200);
        };

        $containerEl.on('popup:dismiss', dismissPopup);
        $containerEl.bind(showType, dismissPopup);

        $containerEl.bind("keydown", function (e) {
            var ev = e || window.event;
            if (ev.keyCode !== 27 && ev.keyCode !== 13) // Escape and enter key support to close thumbnail popup
                return;

            $containerEl.trigger('popup:dismiss');
        });

        // if popup is shown with click event, dismiss it with a click anywhere
        if (showType === 'click') {
            var openEvent = e;
            $(document).on('click.dismissPopup', function (e) {
                if (e.originalEvent !== openEvent.originalEvent) {
                    dismissPopup();
                    $(document).off('.dismissPopup');
                }
            });
        }

        $containerEl.append(fullImageEl);
        document.body.appendChild($containerEl[0]);

        // Animate it

        var topStart = thumbTop - (CONTAINER_BORDER_WIDTH + IMAGE_PADDING);
        var leftStart = thumbLeft - (CONTAINER_BORDER_WIDTH + IMAGE_PADDING);

        if (MadCap.IsIBooks()) {
            $idealContainer = $(aEl).parentsUntil("body").last();
            fullImageWidth = $idealContainer[0].offsetWidth * 0.9;
            fullImageHeight = fullImageWidth * hwRatio;
            containerLeft = $idealContainer.offset().left;
            $containerEl.css({ top: topStart, left: leftStart }).animate(
                {
                    top: containerTop,
                    left: containerLeft,
                    width: fullImageWidth,
                    height: fullImageHeight
                }, 200);

        } else {

            $containerEl.css({ top: topStart, left: leftStart }).animate(
                {
                    top: containerTop,
                    left: containerLeft
                }, 200);
        }

        $(fullImageEl).css({ width: thumbEl.offsetWidth, height: thumbEl.offsetHeight }).animate(
            {
                width: fullImageWidth,
                height: fullImageHeight
            }, 200);

        fullImageEl.focus();
    };

    function LoadBreadcrumbs() {
        var $tocBreadcrumbs = $("div.breadcrumbs[data-mc-toc]");
        var tocData;
        if (!isTriPane) {
            tocData = LoadTocDatafromQuery();
        }

        $tocBreadcrumbs.each(function () {
            var breadcrumbs = new MadCap.WebHelp.Breadcrumbs("Toc", _HelpSystem, this, true);

            breadcrumbs._TocType = tocData.TocType;
            breadcrumbs._TocPath = tocData.TocType == 'Toc' ? tocData.TocPath : tocData.BrowseSequencesPath;
            breadcrumbs._TocHref = tocData.Href;
            breadcrumbs.Init();
        });
    }

    function LoadMenus() {
        var $tocUls = $("ul[data-mc-toc]");
        var tocData;
        if (!isTriPane) {
            tocData = LoadTocDatafromQuery();
        }

        $tocUls.each(function () {
            var self = this;
            var tocPane = new MadCap.WebHelp.TocPane("Toc", _HelpSystem, this, true);

            tocPane._TocType = tocData.TocType;
            tocPane._TocPath = tocData.TocType == 'Toc' ? tocData.TocPath : tocData.BrowseSequencesPath;
            tocPane._TocHref = tocData.Href;
            tocPane.Init(function () {
                // if dynamically generate top nav title menu then fire window resize event
                // to force sticky title to resize
                if (MadCap.Dom.GetAttributeBool(self, "data-mc-top-nav-menu", false)) {
                    $(window).trigger('resize');
                }

                var e = jQuery.Event("loaded");
                $(self).trigger(e);
            });
        });
    }

    function LoadMiniTocs() {
        var $miniTocs = $("div.miniToc[data-mc-toc]");
        var tocData;
        if (!isTriPane && $miniTocs.length > 0) {
            tocData = LoadTocDatafromQuery();

            // adjust tocpath for subproject topics in html5 output
            // build new tocpath based on current subproject root node title
            _HelpSystem.FindNodeInToc("Toc", tocData.TocPath, tocData.Href, function (node) {
                if (node) {
                    var newTocPath = "";
                    var entryHref = _HelpSystem.GetTocEntryHref(node, tocData.TocType, false, true);
                    if (MadCap.Topic.IsEmbeddedTopic())
                        entryHref = decodeURIComponent(entryHref);
                    var currTocData = _HelpSystem.GetTocData(new MadCap.Utilities.Url(entryHref));
                    var needsNewTocPath = tocData[tocData.TocType + "Path"] != currTocData[tocData.TocType + "Path"];

                    if (needsNewTocPath) {
                        var title = node.toc.entries[node.i].title;
                        var splitPath = tocData[tocData.TocType + "Path"].split('|');
                        for (var i = 0; i < splitPath.length; i++) {
                            var step = splitPath[i];
                            if (step == title || newTocPath) {
                                newTocPath += (i == splitPath.length - 1) ? step : (step + "|");
                            }
                        }

                        tocData[tocData.TocType + "Path"] = newTocPath;
                    }
                }

                InitMiniToc(tocData);
            }, null, false);

            return;
        }

        InitMiniToc(tocData);
    }

    function InitMiniToc(tocData) {
        var $miniTocs = $("div.miniToc[data-mc-toc]");
        $miniTocs.each(function () {
            var miniToc = new MadCap.WebHelp.MiniToc("Toc", _HelpSystem, this);

            miniToc._TocType = tocData.TocType;
            miniToc._TocPath = tocData.TocType == 'Toc' ? tocData.TocPath : tocData.BrowseSequencesPath;
            miniToc._TocHref = tocData.Href;
            miniToc.Init();
        });
    }

    function LoadTocDatafromQuery() {
        var helpSystem = _HelpSystem.GetMasterHelpSystem();
        var contentFolder = helpSystem.GetContentPath();
        var current = new MadCap.Utilities.Url(document.location.href);
        if (current.IsFolder) {
            var ext = new MadCap.Utilities.Url(helpSystem.DefaultStartTopic).Extension;
            current = current.AddFile("default." + ext);  // if current path is folder, check for default.htm
        }
        var contentPath = current.ToFolder().CombinePath(contentFolder);
        var href = current.ToRelative(contentPath);

        return _HelpSystem.GetTocData(new MadCap.Utilities.Url(href.FullPath));
    }

    function createMCBacklink() {
        if (_HelpSystem && _HelpSystem.ShowMadCapBacklink &&
            !MadCap.Utilities.HasRuntimeFileType("TriPane") && 
            !MadCap.Utilities.IsMicroContentTopic()) {
            var skin = _HelpSystem.GetCurrentSkin();
            var isFluid = skin && skin.TemplateName == "Fluid";
            var isTopNav = skin && skin.SkinClass.indexOf('topnav') >= 0;
            var isFooter = $('.footer').length != 0;

            var $backlink = createBacklinkElement(isFluid, isTopNav, isFooter);

            // element that is used to set the height to the whole view port
            var $heightContainer = isFluid ? $('.body-container').children().first() : $('body');

            modifyHeight($heightContainer, isFluid, isTopNav, isFooter);
            $heightContainer.append($backlink);

            $(window).on('mc_changeMedium', function () {
                setTimeout(function () {
                    $heightContainer.removeClass();
                    modifyHeight($heightContainer, isFluid, isTopNav, isFooter);
                    $(window).trigger('resize.zf');
                }, 65);
            })
        }
    }

    function modifyHeight($heightContainer, isFluid, isTopNav, isFooter) {
        if ($heightContainer.length === 0)
            return;

        // modify elements so that they're the whole height of the screen
        var margin = $heightContainer.outerHeight(true) - $heightContainer.height();
        if (isFluid)
            margin += $heightContainer.offset().top;

        var minHeight = "calc(100vh - " + margin + "px)";
        if (isFluid || $heightContainer.is('body'))
            $heightContainer.css('min-height', minHeight);

        // add space for the backlink
        if (!isFooter) {
            if (isFluid && !isTopNav) {
                $heightContainer.addClass('height-container-sidenav');
            } else {
                $heightContainer.addClass('height-container-no-footer');
            }
        }

        $heightContainer.addClass('height-container');
    }

    function createBacklinkElement(isFluid, isTopNav, isFooter) {
        var $backlinkContainer = $('<div class="backlink-container"/>');
        var $backlink = $('<a href="https://www.madcapsoftware.com/" rel="nofollow" target="_blank" id="mc-backlink">Powered by MadCap<sup>&reg</sup> Software</a>');
        $backlinkContainer.append($backlink);

        if (!isFluid || isFooter) {
            return $backlinkContainer;
        }
        var className = isTopNav ? 'backlink-container-topnav' : 'backlink-container-sidenav';
        $backlinkContainer.addClass(className);

        return $backlinkContainer;
    }
})();