/*:
 * @plugindesc This plugin just adds a simple screen gamma adjustment option.
 * Version : 1.0.0
 * @author Creta Park (https://creft.me/cretapark)
 *
 * @help
 * |                                                                  |
 * |                  ===== ScreenGammaAdjuster =====                 |
 * |                                                                  |
 * | This plugin just adds a simple screen gamma adjustment option.   |
 * | You can put this plugin and go directly option menu              |
 * | to check new gamma settings.                                     |
 * | Created by Creta Park (https://creft.me/cretapark)               |
 * | License : MIT                                                    |
 * | GitHub page :                                                    |
 * |  https://github.com/creta5164/rpg-maker-mv-screen-gamma-adjuster |
 * | Recommanded MV version : 1.6.2^                                  |
 * |                                                                  |
 * 
 * @param display-text
 * @text Label text
 * @desc The text to be displayed as label in option.
 * @type text
 * @default Screen brightness
 * 
 * @param use-clamp
 * @text Clamp adjustment
 * @desc Limits the brightness adjustment within a range.
 * Disabling it will makes loop through min and max values.
 * @type boolean
 * @default true
 * 
 * @param use-exclusive-screen
 * @text Use exclusive screen
 * @desc Instead of adjusting it in the settings menu,
 * use a exclusive screen to adjust the brightness.
 * @type boolean
 * @default false
 * @on Enable
 * @off Disable
 * 
 * @param exclusive-screen-menu-text
 * @text Exclusive screen menu text
 * @desc The notation used instead when using the
 * exclusive screen in the option menu.
 * @type text
 * @default Change screen brightness
 * 
 * @param exclusive-screen-picture
 * @text Exclusive screen picture
 * @desc Specify the picture to use for adjustment.
 * The picture is always centered.
 * @type file
 * @dir img/pictures/
 */

"use strict"

function ScreenGammaAdjuster() {
    throw new Error("This is a static class.");
}

ScreenGammaAdjuster.MIN_BRIGHTNESS = -10;
ScreenGammaAdjuster.MAX_BRIGHTNESS =  10;
ScreenGammaAdjuster.OPTION_PREFIX  = "ScreenGammaAdjuster.";
ScreenGammaAdjuster.OPTION_BRIGHTNESS        = ScreenGammaAdjuster.OPTION_PREFIX + "Brightness";
ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS = ScreenGammaAdjuster.OPTION_PREFIX + "ChangeBrightness";

Object.defineProperty(
    ScreenGammaAdjuster,
    "Brightness",
    {
        get: function() { return ScreenGammaAdjuster._brightness; },
        set: function(brightness) {
            
            if (!Number.isInteger(brightness))
            {
                console.error("Invalid brightness value. Expected an integer.");
                return;
            }
            
            brightness = brightness.clamp(ScreenGammaAdjuster.MIN_BRIGHTNESS, ScreenGammaAdjuster.MAX_BRIGHTNESS);
            ScreenGammaAdjuster._brightness = brightness;
            
            var brightnessNormal = (brightness * 4) / 255;
            
            var matrix = [
                1, 0, 0, brightnessNormal, 0,
                0, 1, 0, brightnessNormal, 0,
                0, 0, 1, brightnessNormal, 0,
                0, 0, 0,                1, 0
            ];
        
            ScreenGammaAdjuster._toneFilter._loadMatrix(matrix);
        },
        configurable: true
    }
);

ScreenGammaAdjuster._brightness = 0;
ScreenGammaAdjuster._toneFilter = new ToneFilter;
ScreenGammaAdjuster._menuText = "";
ScreenGammaAdjuster._useClamp = false;
ScreenGammaAdjuster._useExclusiveScreen = false;
ScreenGammaAdjuster._exclusiveScreenMenuText = "";
ScreenGammaAdjuster._exclusiveScreenPictureName = "";
ScreenGammaAdjuster._exclusiveScreenSprite = null;

ScreenGammaAdjuster.Initialize = function() {
    
    ScreenGammaAdjuster.Brightness = 0;
    
    var params = PluginManager.parameters("ScreenGammaAdjuster");
    
    ScreenGammaAdjuster._menuText = params["display-text"] || "Screen brightness";
    ScreenGammaAdjuster._useClamp = params["use-clamp"] === "true";
    ScreenGammaAdjuster._useExclusiveScreen = params["use-exclusive-screen"] === "true";
    ScreenGammaAdjuster._exclusiveScreenMenuText = params["exclusive-screen-menu-text"] || "Change screen brightness";
    ScreenGammaAdjuster._exclusiveScreenPictureName = params["exclusive-screen-picture"];
}

ScreenGammaAdjuster.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function() {
    
    var config = ScreenGammaAdjuster.ConfigManager_makeData.call(this);
    ScreenGammaAdjuster.CreateConfigData(config);
    return config;
}

ScreenGammaAdjuster.CreateConfigData = function(config) {
    config.screenBrightness = ScreenGammaAdjuster.Brightness;
}

ScreenGammaAdjuster.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
    
    ScreenGammaAdjuster.ConfigManager_applyData.call(this, config);
    ScreenGammaAdjuster.ApplyFromConfig(config);
}

ScreenGammaAdjuster.ApplyFromConfig = function(config) {
    ScreenGammaAdjuster.Brightness = Number(config.screenBrightness || 0)
        .clamp(ScreenGammaAdjuster.MIN_BRIGHTNESS, ScreenGammaAdjuster.MAX_BRIGHTNESS);
}

ScreenGammaAdjuster.Scene_Base_initialize = Scene_Base.prototype.initialize;
Scene_Base.prototype.initialize = function() {

    ScreenGammaAdjuster.Scene_Base_initialize.call(this);
    this.filters = [ ScreenGammaAdjuster._toneFilter ];
}

ScreenGammaAdjuster.Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
    
    ScreenGammaAdjuster.Scene_Boot_start.call(this);
    
    if (ScreenGammaAdjuster._useExclusiveScreen && !ScreenGammaAdjuster._exclusiveScreenPictureName) {
        
        Graphics.printError(
            "ScreenGammaAdjuster has invalid setup.",
            "<b style='color:fuchsia'>Use exclusive screen</b> are enabled but<br/>"
          + "<b style='color:fuchsia'>Exclusive screen picture</b> is not set.<br/>"
          + "Please check <b style='color:fuchsia'>ScreenGammaAdjuster</b> plugin parameters."
        );
        
        SceneManager.stop();
        
        return;
    }
    
    var exclusiveScreenPicture = ImageManager.loadPicture(ScreenGammaAdjuster._exclusiveScreenPictureName);
    ScreenGammaAdjuster._exclusiveScreenSprite = new Sprite(exclusiveScreenPicture);
}

ScreenGammaAdjuster.Scene_Boot_isReady = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function() {
    
    var isReady = ScreenGammaAdjuster.Scene_Boot_isReady.call(this);
    
    if (ScreenGammaAdjuster._useExclusiveScreen && ScreenGammaAdjuster._exclusiveScreenSprite)
        isReady &= ScreenGammaAdjuster._exclusiveScreenSprite.bitmap.isReady();
    
    return isReady;
}

ScreenGammaAdjuster.Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
Window_Options.prototype.makeCommandList = function() {
    
    ScreenGammaAdjuster.Window_Options_makeCommandList.call(this);
    
    if (ScreenGammaAdjuster._useExclusiveScreen)
        this.addCommand(ScreenGammaAdjuster._exclusiveScreenMenuText, ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS, true);
        
    else
        this.addCommand(ScreenGammaAdjuster._menuText, ScreenGammaAdjuster.OPTION_BRIGHTNESS, true);
}

ScreenGammaAdjuster.Window_Options_processOk = Window_Options.prototype.processOk;
Window_Options.prototype.processOk = function() {
    
    var index = this.index();
    var symbol = this.commandSymbol(index);
    
    if (!symbol.startsWith(ScreenGammaAdjuster.OPTION_PREFIX)) {
        
        ScreenGammaAdjuster.Window_Options_processOk.call(this);
        return;
    }
    
    if (!this.isCommandEnabled(index)) {
        
        SoundManager.playBuzzer();
        return;
    }
    
    switch (symbol) {
        
        default:
            
            SoundManager.playBuzzer();
            break;
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            
            break;
        
        case ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS:
            
            ScreenGammaAdjuster.OpenExclusiveScreen();
            break;
    }
}

ScreenGammaAdjuster.OptionWindow_CursorRight = function(context) {
    
    var index = context.index();
    
    var previousBrightness = ScreenGammaAdjuster.Brightness;
    
    if (!ScreenGammaAdjuster._useClamp && ScreenGammaAdjuster.Brightness + 1 > ScreenGammaAdjuster.MAX_BRIGHTNESS)
        ScreenGammaAdjuster.Brightness = ScreenGammaAdjuster.MIN_BRIGHTNESS;
    
    else
        ScreenGammaAdjuster.Brightness += 1;
    
    if (previousBrightness != ScreenGammaAdjuster.Brightness) {
        
        context.redrawItem(index);
        SoundManager.playCursor();
    }
}

ScreenGammaAdjuster.Window_Options_cursorRight = Window_Options.prototype.cursorRight;
Window_Options.prototype.cursorRight = function(wrap) {
    
    var index = this.index();
    var symbol = this.commandSymbol(index);
    
    if (!symbol.startsWith(ScreenGammaAdjuster.OPTION_PREFIX)) {
        
        ScreenGammaAdjuster.Window_Options_cursorRight.call(this);
        return;
    }
    
    if (!this.isCommandEnabled(index)) {
        
        SoundManager.playBuzzer();
        return;
    }
    
    switch (symbol) {
        
        default:
            
            SoundManager.playBuzzer();
            break;
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            
            ScreenGammaAdjuster.OptionWindow_CursorRight(this);
            break;
        
        case ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS:
            
            break;
    }
}

ScreenGammaAdjuster.OptionWindow_CursorLeft = function(context) {
    
    var index = context.index();
    
    var previousBrightness = ScreenGammaAdjuster.Brightness;
    
    if (!ScreenGammaAdjuster._useClamp && ScreenGammaAdjuster.Brightness - 1 < ScreenGammaAdjuster.MIN_BRIGHTNESS)
        ScreenGammaAdjuster.Brightness = ScreenGammaAdjuster.MAX_BRIGHTNESS;
    
    else
        ScreenGammaAdjuster.Brightness -= 1;
    
    if (previousBrightness != ScreenGammaAdjuster.Brightness) {
        
        context.redrawItem(index);
        SoundManager.playCursor();
    }
}

ScreenGammaAdjuster.Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
Window_Options.prototype.cursorLeft = function(wrap) {
    
    var index = this.index();
    var symbol = this.commandSymbol(index);
    
    if (!symbol.startsWith(ScreenGammaAdjuster.OPTION_PREFIX)) {
        
        ScreenGammaAdjuster.Window_Options_cursorLeft.call(this);
        return;
    }
    
    if (!this.isCommandEnabled(index)) {
        
        SoundManager.playBuzzer();
        return;
    }
    
    switch (symbol) {
        
        default:
            
            SoundManager.playBuzzer();
            break;
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            
            ScreenGammaAdjuster.OptionWindow_CursorLeft(this);
            break;
        
        case ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS:
            
            break;
    }
}

ScreenGammaAdjuster.Window_Options_drawItem = Window_Options.prototype.drawItem;
Window_Options.prototype.drawItem = function(index) {
    
    var symbol = this.commandSymbol(index);
    
    if (!symbol.startsWith(ScreenGammaAdjuster.OPTION_PREFIX)) {
        
        ScreenGammaAdjuster.Window_Options_drawItem.call(this, index);
        return;
    }
    
    var rect = this.itemRectForText(index);
    
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
    
    switch (symbol) {
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            ScreenGammaAdjuster.Window_Options_drawItem.call(this, index);
            break;
        
        case ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS:
            
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'center');
            break;
    }
}

ScreenGammaAdjuster.Window_Options_statusText = Window_Options.prototype.statusText;
Window_Options.prototype.statusText = function(index) {
    
    var symbol = this.commandSymbol(index);
    
    if (!symbol.startsWith(ScreenGammaAdjuster.OPTION_PREFIX)) {
        
        return ScreenGammaAdjuster.Window_Options_statusText.call(this, index);
    }
    
    switch (symbol) {
        
        default:
            SoundManager.playBuzzer();
            break;
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            return ScreenGammaAdjuster.Brightness.toString();
        
        case ScreenGammaAdjuster.OPTION_CHANGE_BRIGHTNESS:
            return "";
    }
}

ScreenGammaAdjuster.OpenExclusiveScreen = function() {
    
    if (!ScreenGammaAdjuster._useExclusiveScreen
     || SceneManager._scene instanceof Scene_ExclusiveGammaAdjustment)
        return;
    
    SoundManager.playOk();
    SceneManager.push(Scene_ExclusiveGammaAdjustment);
}

function Scene_ExclusiveGammaAdjustment() {
    this.initialize.apply(this, arguments);
}

Scene_ExclusiveGammaAdjustment.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ExclusiveGammaAdjustment.prototype.constructor = Scene_ExclusiveGammaAdjustment;

Scene_ExclusiveGammaAdjustment.prototype.create = function() {
    
    Scene_MenuBase.prototype.create.call(this);
    
    this._optionsWindow = new Window_GammaAdjustmentSlider();
    this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._optionsWindow);
    
    var pictureBottom = this._screenSprite.y + this._screenSprite.height + 50;
    var screenBottom = Graphics.boxHeight - this._optionsWindow.height - 50;
    
    this._optionsWindow.x = Graphics.boxWidth / 2 - this._optionsWindow.width / 2;
    this._optionsWindow.y = Math.min(pictureBottom, screenBottom);
}

Scene_ExclusiveGammaAdjustment.prototype.createBackground = function() {
    
    Scene_MenuBase.prototype.createBackground.call(this);
    
    this._screenSprite = ScreenGammaAdjuster._exclusiveScreenSprite;
    this.addChild(this._screenSprite);
    
    this._screenSprite.x = Graphics.boxWidth / 2  - this._screenSprite.width  / 2;
    this._screenSprite.y = Graphics.boxHeight / 2 - this._screenSprite.height / 2;
}

Scene_ExclusiveGammaAdjustment.prototype.terminate = function() {
    
    this.removeChild(this._screenSprite);
    
    Scene_MenuBase.prototype.terminate.call(this);
    ConfigManager.save();
}

function Window_GammaAdjustmentSlider() {
    this.initialize.apply(this, arguments);
}

Window_GammaAdjustmentSlider.prototype = Object.create(Window_Command.prototype);
Window_GammaAdjustmentSlider.prototype.constructor = Window_GammaAdjustmentSlider;

Window_GammaAdjustmentSlider.prototype.windowWidth = function() {
    
    return Graphics.boxWidth / 2.5;
}

Window_GammaAdjustmentSlider.prototype.makeCommandList = function() {
    
    this.addCommand(ScreenGammaAdjuster._menuText, ScreenGammaAdjuster.OPTION_BRIGHTNESS, true);
    this.addCommand(TextManager.save, "exit", true);
}

Window_GammaAdjustmentSlider.prototype.statusWidth = function() {
    
    return 120;
}

Window_GammaAdjustmentSlider.prototype.drawItem = function(index) {
    
    var rect = this.itemRectForText(index);
    var symbol = this.commandSymbol(index);
    
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
    
    if (symbol == "exit") {
        
        this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'center');
        return;
    }
    
    var statusWidth = this.statusWidth();
    var titleWidth = rect.width - statusWidth;
    this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
    this.drawText(this.statusText(index), titleWidth, rect.y, statusWidth, 'right');
}

Window_GammaAdjustmentSlider.prototype.statusText = function(index) {
    
    var symbol = this.commandSymbol(index);
    
    switch (symbol) {
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            return ScreenGammaAdjuster.Brightness.toString();
    }
}

Window_GammaAdjustmentSlider.prototype.processOk = function() {
    
    switch (this.currentSymbol()) {
        
        case "exit":
            
            SoundManager.playOk();
            this.callHandler('cancel');
            break;
    }
}

Window_GammaAdjustmentSlider.prototype.cursorLeft = function() {
    
    switch (this.currentSymbol()) {
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            
            ScreenGammaAdjuster.OptionWindow_CursorLeft(this);
            break;
    }
}

Window_GammaAdjustmentSlider.prototype.cursorRight = function() {
    
    switch (this.currentSymbol()) {
        
        case ScreenGammaAdjuster.OPTION_BRIGHTNESS:
            
            ScreenGammaAdjuster.OptionWindow_CursorRight(this);
            break;
    }
}

ScreenGammaAdjuster.Initialize();