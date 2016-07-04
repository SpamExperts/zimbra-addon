function SpamExpertsZimlet() {

}
SpamExpertsZimlet.prototype = new ZmZimletBase();
SpamExpertsZimlet.prototype.constructor = SpamExpertsZimlet;

SpamExpertsZimlet.BUTTON_ID = "SpamExpertsZimletBtn";

SpamExpertsZimlet.prototype.init = function() {

    this.spamexperts_controlPanelUrl = (this.getUserProperty("spamexperts_controlPanelUrl") != undefined)
        ? this.getUserProperty("spamexperts_controlPanelUrl") : "";
    this.spamexperts_controlPanelUsername = (this.getUserProperty("spamexperts_controlPanelUsername") != undefined)
        ? this.getUserProperty("spamexperts_controlPanelUsername") : "";
    this.spamexperts_controlPanelPassword = (this.getUserProperty("spamexperts_controlPanelPassword") != undefined)
        ? this.getUserProperty("spamexperts_controlPanelPassword") : "";
    this.spamexperts_moveToTrash = (this.getUserProperty("spamexperts_moveToTrash") != undefined)
        ? this.getUserProperty("spamexperts_moveToTrash") : 0;
};

//define zimblet actions

SpamExpertsZimlet.prototype.menuItemSelected =
    function(itemId) {
        switch (itemId) {
            //display popup for settings
            case "SPAMEXPERTS_MENU_ITEM_ID1":
                if (!this._controlPanelSettingsDialog) {
                    this._controlPanelSettingsDialog = this.openSettingsPopup('controlPanelSettings');
                }
                break;
            case "SPAMEXPERTS_MENU_ITEM_ID2":
                if (this.spamexperts_controlPanelUrl && this.spamexperts_controlPanelUsername && this.spamexperts_controlPanelPassword) {
                    //open new tab
                    if (this.spamexperts_app == undefined) {
                        this.spamexperts_app = this.createApp(this.getMessage("zimletName"), "zimbraIcon", "Control Panel");
                    }
                } else {
                    this._controlPanelSettingsErrDialog = this.openSettingsPopup('controlPanelSettingsErr');
                }
                break;
            case "SPAMEXPERTS_MENU_ITEM_ID3":
                //if (!this._reportSpamSettingsDialog) {
                    this._reportSpamSettingsDialog = this.openSettingsPopup('reportSpamSettings');
                //}
                break;
            default:
                // do nothing
                break;
        }

    };

//executes when tab is open

SpamExpertsZimlet.prototype.appLaunch =
    function(appName) {
        switch (appName) {
            case this.spamexperts_app: {
                // create tab and set iframe
                var app = appCtxt.getApp(appName); // get access to ZmZimletApp

                // write HTML to app
                app.setContent(
                    "<iframe id=\"spamexperts_iframe\" name=\"spamexperts_iframe\" src=\"\" width=\"100%\" height=\"100%\" /></iframe>");

                // automatically login
                this._loginToControlPanel();

                // get tab and add listener to automatically log in each time the tab is activate
                var controller = appCtxt.getAppController();
                var appChooser = controller.getAppChooser();
                var spamExpertsTabBtn = appChooser.getButton(this.spamexperts_app); // returns ZmAppButton

                var that = this;
                spamExpertsTabBtn.addSelectionListener(new AjxListener(this,
                    function(){that._loginToControlPanel()}, controller));

                break;
            }
        }
    };

SpamExpertsZimlet.prototype.initializeToolbar = function(app, toolbar, controller, view) {

	// only add this button for the following 3 views
	if (view == ZmId.VIEW_CONVLIST || view == ZmId.VIEW_CONV
			|| view == ZmId.VIEW_TRAD) {
		if (toolbar.getOp(SpamExpertsZimlet.BUTTON_ID)) {
			return;
		}
		// get the index of View menu so we can display it after that.
		var buttonIndex = -1;
		for ( var i = 0, count = toolbar.opList.length; i < count; i++) {
			if (toolbar.opList[i] == ZmOperation.VIEW_MENU) {
				buttonIndex = i + 1;
				break;
			}
		}

		// create params obj with button details
        var buttonArgs = {
            text : this.getMessage("zimletName"),
            tooltip : this.getMessage("zimletDescription"),
            image : "SpamExperts-panelIcon",
            index : buttonIndex
        };

		// toolbar.createOp api creates the button with some id and params
		// containing button details.
		var button = toolbar.createOp(SpamExpertsZimlet.BUTTON_ID, buttonArgs);
		button.addSelectionListener(new AjxListener(this,
				this._handleToolbarBtnClick, controller));

		controller._mailListView.addSelectionListener(new AjxListener(this,
				this._listSelectionListener, {
					mailListView : controller._mailListView,
					button : button
				}));

	}
};

// called by zimbra-core when menu is initialized (on right click on a message)
SpamExpertsZimlet.prototype.onActionMenuInitialized = function(controller, menu) {
	var ID = SpamExpertsZimlet.BUTTON_ID;
	if (!menu.getMenuItem(SpamExpertsZimlet.BUTTON_ID)) {

        var buttonArgs = {
            text: this.getMessage("reportSpamMenuItem"),
            tooltip: this.getMessage("reportSpamMenuItemDescription"),
            image: "SpamExperts-panelIcon",
            id: SpamExpertsZimlet.BUTTON_ID
        }

		var opDesc = ZmOperation.defineOperation(null, buttonArgs);
		menu.addOp(SpamExpertsZimlet.BUTTON_ID, 1000);// add the button at the bottom

        var that = this;

        //add action
		menu.addSelectionListener(SpamExpertsZimlet.BUTTON_ID, new AjxListener(this,
				function() {
                    that._reportSpam(controller._actionEv.item );
                }, controller));
	}
};


SpamExpertsZimlet.prototype._listSelectionListener = function(params, ev) {
	if (params.mailListView.getSelectionCount() > 0) {
		params.button.setEnabled(true);
	}
};

//report an email as spam to our system

SpamExpertsZimlet.prototype._reportSpam = function(msgId) {
        var jspUrl = window.location.origin+"/service/home/~/?auth=co&view=text&id=" + Math.abs(msgId.id);

        var response = AjxRpc.invoke(null, jspUrl, null, null, true);

        if (response.success == true) {
            var serverUrl = "https://spamreport.spamrl.com/spamreport.php";

            var proxyServletUrl = [ZmZimletBase.PROXY, serverUrl].join("");
            var reqParam = "mailContent=" + response.text;
            var reqHeader = {"Content-Type": "application/x-www-form-urlencoded"};

            AjxRpc.invoke(reqParam, proxyServletUrl, reqHeader, new AjxCallback(this, function (response) {

                if (response.success == false || response.text != "OK") {
                    // display the error response
                    appCtxt.getAppController().setStatusMsg("Error: " + response.text, ZmStatusView.LEVEL_WARNING);
                    return;
                }

                // display the response
                appCtxt.getAppController().setStatusMsg(this.getMessage("spamWasReported"));

                //if (this.spamexperts_moveToTrash) {
                    this._moveToTrash(msgId);
                //}

            }), false);
        }
};

SpamExpertsZimlet.prototype._saveControlPanelSettings = function(app) {
    //test credentials before saving
    var urlValue = document
        .getElementById("spamexperts_controlPanelUrl").value;
    var usernameValue = document
        .getElementById("spamexperts_controlPanelUsername").value;
    var passwordValue = document
        .getElementById("spamexperts_controlPanelPassword").value;

    //try to test the credentials before saving them

    //we will do an api call to get the version

    var apiCall = "/api/version/get/format/json/";

    var proxyServletUrl = [ZmZimletBase.PROXY, urlValue+apiCall].join("");

    var reqParam = null;

    //set auth token
    var reqHeader = {"Authorization": "Basic " + btoa(usernameValue + ":" + passwordValue)};

    var that = this;

    AjxRpc.invoke(reqParam, proxyServletUrl, reqHeader,
        new AjxCallback(this, function(response){

            var isSuccess = false;

            if (response.success == true) {
                var r = JSON.parse(response.text);
                if (r.result !== undefined && Math.abs(parseInt(r.result)) > 0) {
                    isSuccess = true;
                }
            }

            if (isSuccess) {

                app.spamexperts_controlPanelUrl = urlValue;
                app.spamexperts_controlPanelUsername = usernameValue;
                app.spamexperts_controlPanelPassword = passwordValue;

                app.setUserProperty("spamexperts_controlPanelUrl",
                    app.spamexperts_controlPanelUrl);
                app.setUserProperty("spamexperts_controlPanelUsername",
                    app.spamexperts_controlPanelUsername);
                app.setUserProperty("spamexperts_controlPanelPassword",
                    app.spamexperts_controlPanelPassword);

                 app.saveUserProperties();

                appCtxt.getAppController().setStatusMsg(
                    app.getMessage("settingsSaved"),
                    ZmStatusView.LEVEL_INFO
                );

                app.controlPanelSettingsDialog.popdown();// hide the dialog
                app.controlPanelSettingsErrDialog.popdown();
            } else {
                appCtxt.getAppController().setStatusMsg(
                    app.getMessage("settingsNotSaved"),
                    ZmStatusView.LEVEL_CRITICAL
                );
            }
        }), false);

};

// Save settings for spam reporting

SpamExpertsZimlet.prototype._saveReportSpamSettings = function(app) {
    app.spamexperts_moveToTrash = document.getElementById("spamexperts_moveToTrash").value;

    app.setUserProperty("spamexperts_moveToTrash",
        app.spamexperts_moveToTrash);

    app.saveUserProperties();

    appCtxt.getAppController().setStatusMsg(
        app.getMessage("settingsSaved"),
        ZmStatusView.LEVEL_INFO
    );

    app.reportSpamSettingsDialog.popdown();// hide the dialog

    app.reportSpamSettingsDialog = null;
}

SpamExpertsZimlet.prototype.openSettingsPopup = function(settingsView) {
    var popupName = settingsView+"Dialog";

    // if zimlet dialog already exists...

    if (this[popupName]) {
        this[popupName].popup();
        return;
    }
    var view = "";
    var saveAction = null;
    var title = "";

    switch(settingsView) {
        case 'controlPanelSettings':
            view = this._getControlPanelSettingsView();
            saveAction = this._saveControlPanelSettings;
            title = this.getMessage("controlPanelSettings");
            break;
        case 'reportSpamSettings':
            view = this._getReportSpamSettingsView();
            saveAction = this._saveReportSpamSettings;
            title = this.getMessage("reportSpamSettings");
            break;
        case 'controlPanelSettingsErr':
            view = this._getControlPanelSettingsErrView() + this._getControlPanelSettingsView();
            saveAction = this._saveControlPanelSettings;
            title = this.getMessage("controlPanelSettings");
            break;
        default:

    }

    var pView = new DwtComposite(this.getShell());
    pView.getHtmlElement().innerHTML = view;

    this[popupName] = new ZmDialog({
        parent : this.getShell(),
        title : title,
        view : pView,
        standardButtons : [ DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON ]
    });

    if (saveAction) {
        var that = this;
        this[popupName].setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this,
            function() {
                saveAction.call(this, that);
            }));
    }

    this[popupName].popup();
};

SpamExpertsZimlet.prototype._getControlPanelSettingsErrView =  function() {
    return "<p>"+this.getMessage("controlPanelSettingsErr")+"<p>";
}

SpamExpertsZimlet.prototype._getReportSpamSettingsView = function () {
    var html = new Array();
    var i = 0;

    var checked = "";
    var ckbValue = 0;

    if (this.spamexperts_moveToTrash == 1) {
        checked = "checked='checked'";
        ckbValue = 1;
    }

    html[i++] = "<div class='divspamexperts-settings'>";
    html[i++] = "<p>";
    html[i++] = "<span>"+this.getMessage("moveToTrash")+"</span>";
    html[i++] = "<input type='checkbox' value='"+ckbValue+"' id='spamexperts_moveToTrash' "+checked+" onclick='this.value = (this.value-1)*-1' />";
    html[i++] = "</p>";
    html[i++] = "</div>";

    return html.join("");
}

SpamExpertsZimlet.prototype._getControlPanelSettingsView = function() {
    var html = new Array();
    var i = 0;

    html[i++] = "<div class='divspamexperts-settings'>";
    html[i++] = "<p>";
    html[i++] = "<span>"+this.getMessage("controlPanelUrl")+"</span>";
    html[i++] = "<input type='text' value='"+this.spamexperts_controlPanelUrl
        + "' id='spamexperts_controlPanelUrl' />";
    html[i++] = "</p>";
    html[i++] = "<p>";
    html[i++] = "<span>"+this.getMessage("controlPanelUsername")+"</span>";
    html[i++] = "<input type='text' value='"+this.spamexperts_controlPanelUsername
        + "' id='spamexperts_controlPanelUsername' />";
    html[i++] = "</p>";
    html[i++] = "<p>";
    html[i++] = "<span>"+this.getMessage("controlPanelPassword")+"</span>";
    html[i++] = "<input type='password' value='"+this.spamexperts_controlPanelPassword
        + "' id='spamexperts_controlPanelPassword' />";
    html[i++] = "</p>";
    html[i++] = "</div>";
    return html.join("");
};

SpamExpertsZimlet.prototype._loginToControlPanel = function() {

    //create auth ticket
    var apiCall = "/api/authticket/create/username/"+this.spamexperts_controlPanelUsername;
    var proxyServletUrl = [ZmZimletBase.PROXY, this.spamexperts_controlPanelUrl+apiCall].join("");
    var reqParam = null;

    //set auth token
    var reqHeader = {"Authorization": "Basic " + btoa(this.spamexperts_controlPanelUsername + ":" + this.spamexperts_controlPanelPassword)};

    AjxRpc.invoke(reqParam, proxyServletUrl, reqHeader,
        new AjxCallback(this, function(response){

            var isSuccess = false;

            if (response.success == true) {
                var token = response.text;
                if (token.length == 40) {
                    document.getElementById("spamexperts_iframe").src = this.spamexperts_controlPanelUrl+"/index.php?authticket="+token;
                }
            }

        }), false);
};

SpamExpertsZimlet.prototype._moveToTrash = function(item) {
    var requestType = "MsgActionRequest";

    if (item.type == ZmItem.CONV) {
        requestType = "ConvActionRequest";
    }

    console.log(item.id);

    var soapDoc = AjxSoapDoc.create(requestType, "urn:zimbraMail");

    soapDoc.set("action", {
        id: item.id,
        op: "trash",
        tcon: "-tjs"
    });

    var async = window.parentController == null;
    appCtxt.getAppController().sendRequest({
        soapDoc : soapDoc,
        asyncMode : async
    });
}
