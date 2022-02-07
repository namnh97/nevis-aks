// display oauth scopes listed in input field 'consentInformation'
// change 'consentInformation' and 'scope_name' to the values used in your configuration.
$(function() {

    var consentInformationFieldName = "consentInformation"; // name of the input field from which to parse the value as the consent information JSON
    var scopeDescriptionSource = "scope_name";              // key of the field in the consent information JSON of which to get the value as the scope description

    function displayOAuthScopesConsent() {
        var jsonData = parseJson();
        if (jsonData !== undefined) {
            mapJsonToHtml(jsonData)
        }
    }

    function mapJsonToHtml(jsonData) {
        mapJsonToHtmlScopeList("listOfRequestedScopesWithExistingConsent", jsonData.requestedScopesWithExistingConsent, "Already accepted scopes:");
        mapJsonToHtmlScopeList("listOfRequestedScopes", jsonData.requestedScopesRequiringConsent, "Requested scopes that require a consent:");
    }

    function mapJsonToHtmlScopeList(elementId, scopeInformation, title) {
        if (scopeInformation !== undefined && Object.keys(scopeInformation).length > 0) {
            $("input[name=" + consentInformationFieldName +"]").after("<p style='margin-top: 0.5em'>" + title + "</p><div class='scopeinfobox'><ul id='" + elementId + "' /> </div>");
            jQuery.each(scopeInformation, function(key,value) {
                var scopeDescription = value[scopeDescriptionSource];
                if (scopeDescription) {
                    $("#" + elementId).append('<li>' + scopeDescription + '</li>');
                } else {
                    $("#" + elementId).append('<li>' + key + '</li>');
                }
            });
        }
    }

    function parseJson() {
        var consentInformationField = $("input[name=" +consentInformationFieldName +"]");
        if (consentInformationField.length > 0) {
            return JSON.parse(consentInformationField.val());
        }
    }

    displayOAuthScopesConsent();
});

