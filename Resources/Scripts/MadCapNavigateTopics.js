/*!
 * Copyright MadCap Software
 * http://www.madcapsoftware.com/
 * Unlicensed use is strictly prohibited
 *
 * v16.0.7426.25547
 */
var _HelpSystem;

(function () {
    if (!MadCap.Utilities.HasRuntimeFileType("Default"))
        return;

    MadCap.WebHelp.HelpSystem.LoadHelpSystemDefault().done(function (helpSystem) {
        _HelpSystem = helpSystem;
    })

    $(document).ready(function () {
        initButtons();
    });

    MadCap.Utilities.MessageBus.AddMessageHandler(NavigateMessageHandler);
})();

function initButtons() {
    $(".previous-topic-button").on('click', function (e) {
        PreviousTopic();
        $("#topic").focus();
    });

    $(".next-topic-button").on('click', function (e) {
        NextTopic();
        $("#topic").focus();
    });
}

function PreviousTopic() {
    AdvanceTopic("previous");
}

function NextTopic() {
    AdvanceTopic("next");
}

function AdvanceTopic(moveType) {
    GetAdvanceUrl(moveType, function (href) {
        if (href) {
            if (isTriPane)
                document.location.hash = href;
            else {
                var current = new MadCap.Utilities.Url(document.location.href);
                var currentSkin = _HelpSystem.GetCurrentSkin();
                var hrefUrl = new MadCap.Utilities.Url(href);
                var q = hrefUrl.QueryMap.GetLength() > 0 ? '&' : '?';
                var skinQuery = _HelpSystem.DefaultSkin != currentSkin ? (q + "skinName=" + currentSkin.SkinID) : "";
                var newUrl = current.ToFolder().CombinePath(href);
                document.location.href = newUrl.PlainPath + newUrl.Query + skinQuery + newUrl.Fragment;
            }
        }
    });
}

function GetAdvanceUrl(moveType, CallBackFunc) {
    var win = isTriPane ? frames["topic"] : window;

    MadCap.Utilities.MessageBus.PostMessageRequest(win, "get-topic-url", null, function (data) {
        var href = new MadCap.Utilities.Url(data[0]);
        var root = isTriPane ? new MadCap.Utilities.Url(decodeURIComponent(document.location.href)) : new MadCap.Utilities.Url(document.location.href);
        var appendTocPath = isTriPane || _HelpSystem.TopNavTocPath;

        var queryMapUrl = (isTriPane && !(root.QueryMap.GetItem('TocPath') || root.QueryMap.GetItem('BrowseSequencesPath')) && !MadCap.String.IsNullOrEmpty(root.Fragment)) ? new MadCap.Utilities.Url(root.Fragment) : root;

        var tocPath = queryMapUrl.QueryMap.GetItem('TocPath');
        var bsPath = queryMapUrl.QueryMap.GetItem('BrowseSequencesPath');

        root = root.ToPlainPath();
        if (!root.IsFolder)
            root = root.ToFolder();

        if (isTriPane) {
            var query = href.Query;
            var plainPath = decodeURIComponent(href.PlainPath);
            href = new MadCap.Utilities.Url(plainPath + query);
        }
        var contentFolder = root.CombinePath(_HelpSystem.GetMasterHelpSystem().GetContentPath());
        href = href.ToRelative(contentFolder);

        if (bsPath != null) {
            _HelpSystem.AdvanceTopic("BrowseSequences", moveType, bsPath, appendTocPath, href, CallBackFunc);
        } else {
            _HelpSystem.AdvanceTopic("Toc", moveType, tocPath, appendTocPath, href, CallBackFunc);
        }
    });
}

function NavigateMessageHandler(message, dataValues, responseData, messageSource, messageID) {
    var returnData = { Handled: false, FireResponse: true };

    if (message == "navigate") {
        var path = dataValues[0];

        if (path)
            MadCap.Utilities.Url.NavigateHash(path);

        returnData.Handled = true;
        returnData.FireResponse = true;
    }
    else if (message == "navigate-topic") {
        var path = dataValues[0];

        if (!MadCap.Utilities.HasRuntimeFileType("TriPane")) {
            var abs = _HelpSystem.GetAbsoluteTopicPath("../" + _HelpSystem.ContentFolder + path);
            MadCap.Utilities.Url.Navigate(abs.FullPath);
        }

        var href = new MadCap.Utilities.Url(path);

        if (href.IsAbsolute) {
            // path will be absolute so make it relative to the home folder
            var homeUrl = new MadCap.Utilities.Url(document.location.href);
            homeUrl = new MadCap.Utilities.Url(homeUrl.PlainPath);
            var homeFolder = MadCap.String.EndsWith(homeUrl.FullPath, "/") ? homeUrl : homeUrl.ToFolder(); // Don't need .ToFolder() in the case that the page URL ends in a '/' (could happen when located on a web server: http://mydomain.com/WebHelp2/)
            var contentFolder = homeFolder.CombinePath(_HelpSystem.ContentFolder);
            href = href.ToRelative(contentFolder);
        }

        if (href.FullPath) {
            var newHash = MadCap.Utilities.Url.StripInvalidCharacters(href.FullPath);
            var currentHash = MadCap.Utilities.Url.CurrentHash();

            // if clicking link to currently displayed topic, reset the hash to trigger Window_Onhashchange
            if (currentHash.substring(1) == newHash)
                document.location.hash = null;

            document.location.hash = newHash;
        }

        returnData.Handled = true;
    }
    else if (message == "navigate-home") {
        var defaultUrl = isTriPane ? new MadCap.Utilities.Url(document.location.href)
            : _HelpSystem.GetAbsoluteTopicPath("../" + _HelpSystem.DefaultStartTopic);

        MadCap.Utilities.Url.Navigate(defaultUrl.PlainPath);

        returnData.Handled = true;
    }
    else if (message == "navigate-previous") {
        PreviousTopic();
        returnData.Handled = true;
    }
    else if (message == "navigate-next") {
        NextTopic();
        returnData.Handled = true;
    }

    return returnData;
}