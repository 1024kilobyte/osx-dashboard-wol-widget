var gEditMode = false;
 
function setup()
{       
    // Localize UI
    document.getElementById("newElementTitleDiv").childNodes[0].nodeValue = getLocalizedString("Create new element");
    document.getElementById("newElementNameInputLabel").childNodes[0].nodeValue = getLocalizedString("Name");
    document.getElementById("newElementMACInputLabel").childNodes[0].nodeValue = getLocalizedString("MAC");
    document.getElementById("newElementSubnetInputLabel").childNodes[0].nodeValue = getLocalizedString("Subnet");
    document.getElementById("newElementPortInputLabel").childNodes[0].nodeValue = getLocalizedString("Port");
    document.getElementById("newElementAddButton").value = getLocalizedString("Add element");
    
    // Create edit button
    new AppleGlassButton(document.getElementById("editButton"), getLocalizedString("edit"), toggleEditMode);
    
    // Draw all saved wol elements
    drawWolElements();
    
    // Resize window according to element count    
    setWindowSize();
}

function drawWolElements() {
    // First remove all childnodes from element container
    var elementContainer = document.getElementById("elementContainer");
    
    while (elementContainer.firstChild) {
        elementContainer.removeChild(elementContainer.firstChild);
    }
    
    // Draw all saved wol elements
    var elementCounter = 0;
    var currentElementName = widget.preferenceForKey("wolElement" + elementCounter + "Name");

    while(currentElementName && currentElementName.length > 0) {
        // Create a wrapper element for the list entry
        var newElementDiv = document.createElement("div");
        newElementDiv.setAttribute("class", "elementRow");
        elementContainer.appendChild(newElementDiv);
        
        // If in edit mode, show delete control
        if (gEditMode) {
            var deleteElementButtonDiv = document.createElement("div");
            deleteElementButtonDiv.setAttribute("id", "" + elementCounter + "");
            deleteElementButtonDiv.setAttribute("class", "elementDeleteButton");
            newElementDiv.appendChild(deleteElementButtonDiv);
            
            new AppleButton(deleteElementButtonDiv, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 20, "", "", 0, "button/del-btn.png", "button/del-btn.png", "", "", 0, deleteElementClicked);
        }
        
        // Create an action button to wake up
        var newElementWakeButton = document.createElement("div");
        newElementWakeButton.setAttribute("id", "" + elementCounter + "");
        newElementWakeButton.setAttribute("class", "elementWakeButton");
        newElementDiv.appendChild(newElementWakeButton);
        
        new AppleGlassButton(newElementWakeButton, getLocalizedString("wake"), wakeUpClicked);
        
        // Create an element for the title of the entry
        var newElementTitle = document.createElement("div");
        newElementTitle.setAttribute("class", "elementNameText");
        newElementTitle.appendChild(document.createTextNode(widget.preferenceForKey("wolElement" + elementCounter + "Name"))); 
        newElementDiv.appendChild(newElementTitle);
        
        elementCounter++;
        currentElementName = widget.preferenceForKey("wolElement" + elementCounter + "Name");
    }
}

function toggleEditMode()
{
    // Toggle the mode
    gEditMode = !gEditMode;
    
    // Show / Hide "new element" controls
    document.getElementById("addElementContainer").style.display = (gEditMode) ? "block" : "none";
    
    // Resize window to fit in the add element control
    setWindowSize();
    
    // Redraw element list
    drawWolElements();
}

/****************************
* Add / Remove wol elements *
*****************************/
function addNewElementClicked() {
    // Validate input
    if (!validateNewElementData()) return;
    
    // Check how many elements are saved
    var elementCounter = 0;
    while (widget.preferenceForKey("wolElement" + elementCounter + "Name")) elementCounter++;
    
    // Save new element data
    setElementSetting(elementCounter, document.getElementById("newNameField").value, document.getElementById("newMACAddressField").value, document.getElementById("newSubnetField").value, document.getElementById("newPortField").value);

    // Reset input fields
    resetInputFields();

    // Switch back to normal view
    toggleEditMode();
}

function deleteElementClicked(event) {
    // Get clicked element index
    var elementIndex = Number(event.target.parentNode.parentNode.id);
    
    // Remove settings for element
    setElementSetting(elementIndex, null, null, null, null);
    
    // Re-index elements with a higher index
    elementIndex++;
    
    while(widget.preferenceForKey("wolElement" + elementIndex + "Name")) {
        var currentElementSettings = getElementSettingByIndex(elementIndex);
        setElementSetting(elementIndex-1, currentElementSettings[3], currentElementSettings[0], currentElementSettings[1], currentElementSettings[2]);
        setElementSetting(elementIndex, null, null, null, null);
        elementIndex++;
    }
    
    // Redraw element list
    drawWolElements();
    
    // Fit window to new element count
    setWindowSize();
}

/**************************
* Set and get preferences *
***************************/
function setElementSetting(index, name, macAddress, broadcastAddress, port) {
    widget.setPreferenceForKey(name, "wolElement" + index + "Name");
    widget.setPreferenceForKey(macAddress, "wolElement" + index + "MAC");
    widget.setPreferenceForKey(broadcastAddress, "wolElement" + index + "Subnet");
    widget.setPreferenceForKey(port, "wolElement" + index + "Port");
}

function getElementSettingByIndex(elementIndex) {
    return [widget.preferenceForKey("wolElement" + elementIndex + "MAC"), widget.preferenceForKey("wolElement" + elementIndex + "Subnet"), widget.preferenceForKey("wolElement" + elementIndex + "Port"), widget.preferenceForKey("wolElement" + elementIndex + "Name")];
}

/**************************
 * WOL section
 **************************/
function wakeUpClicked(event) {
    var elementIndex = event.target.parentNode.parentNode.id;
    sendMagicPacketToElementAtIndex(elementIndex);
}

function sendMagicPacketToElementAtIndex(elementIndex) {
    var elementSetting = getElementSettingByIndex(elementIndex);
    
    var address = elementSetting[0];
    var subnet = elementSetting[1];
    var port = elementSetting[2];
    
    var commandString = '/usr/bin/python wol.py ' + address + ' ' + subnet + ' ' + port;
    
    // Send the magic packet via python script
    widget.system(commandString);
}

/**********
* Helpers *
***********/
function resetInputFields() {
    document.getElementById("newNameField").value = "";
    document.getElementById("newMACAddressField").value = "";
    document.getElementById("newSubnetField").value = "255.255.255.255";
    document.getElementById("newPortField").value = "9";
}

function setWindowSize() {
    var windowWidth = window.innerWidth;
    
    // Calculate new window height, based on the element count
    var elementCounter = 0;
    while (widget.preferenceForKey("wolElement" + elementCounter + "Name")) elementCounter++;
    var windowHeight = 50 + elementCounter * 24;
    
    // Add additional size for the create new element part
    if (gEditMode) windowHeight += 153;
    
    window.resizeTo(windowWidth, windowHeight);
}

function getLocalizedString(key)
{
    try {
        var ret = localizedStrings[key];
        if (typeof ret !== "undefined") return ret;
    } catch (ex) {}
 
    return key;
}

/************************
* Validate input values *
*************************/
function validateNewElementData() {
    var invalidFields = [];
    
    // Validate name
    var nameField = document.getElementById("newNameField");
    if (!isNameValid(nameField.value)) invalidFields.push(nameField);
    else nameField.className = "inputTextField";
    
    // Validate mac address
    var macAddressField = document.getElementById("newMACAddressField");
    if (!isMACAddressValid(macAddressField.value.toLowerCase())) invalidFields.push(macAddressField);
    else macAddressField.className = "inputTextField";
    
    // Validate subnet
    var subnetField = document.getElementById("newSubnetField");
    if (!isSubnetValid(subnetField.value)) invalidFields.push(subnetField);
    else subnetField.className = "inputTextField";
    
    // Validate port
    var portField = document.getElementById("newPortField");
    if (!isPortValid(portField.value)) invalidFields.push(portField);
    else portField.className = "inputTextField";
    
    // If there where invalid values use error css
    if (invalidFields.length === 0) return true;
    else {
        invalidFields.forEach(function(currentField) {
            currentField.className = "inputTextFieldError";
        });
        
        return false;   
    }
}

function isNameValid(newElementName) {
    // Check if name is not empty
    if (newElementName.length === 0) return false;
    
    // Check if name already exists
    var elementIndex = 0;
    
    while(widget.preferenceForKey("wolElement" + elementIndex + "Name")) {
        var currentElementName = widget.preferenceForKey("wolElement" + elementIndex + "Name");
        if (currentElementName === newElementName) return false;
        elementIndex++;
    }
    
    return true;
}

function isMACAddressValid(macAddress) {
    var regEx = /^(?!(?:ff:ff:ff:ff:ff:ff|00:00:00:00:00:00))(?:[\da-f]{2}:){5}[\da-f]{2}$/i;
    
    return regEx.test(macAddress);
}

function isSubnetValid(newElementSubnet) {
    // Subnet must consist of exact 4 parts
    var subnetParts = newElementSubnet.split(".");
        
    if (subnetParts.length !== 4) return false;
    
    // Check each part of the subnet
    for (var counter = 0; counter < 4; counter++) {
        // Check if part is a number
        if (isNaN(subnetParts[counter])) return false;
        
        // Check if parts are numbers between 0 and 255
        var currentSubnetPart = Number(subnetParts[counter]);
        if (currentSubnetPart <= 0 || currentSubnetPart > 255) return false;
        
        // At least the last element must be 255
        if (counter === 3 && currentSubnetPart !== 255) return false;
    }
    
    return true;
}

function isPortValid(newElementPort) {
    // Port value has to be a number
    if (isNaN(newElementPort)) return false;
    
    // Port numbers are only valid between 0 and 65535
    var newPortNumber = Number(newElementPort);
    
    if (newPortNumber <= 0 || newPortNumber > 65535) return false;
    
    return true;
}