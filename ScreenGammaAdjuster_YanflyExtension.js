/*:
 * @plugindesc This plugin helps to integrate ScreenGammaAdjuster plugin for Yanfly plugins.
 * Version : 1.0.0
 * @author Creta Park (https://creft.me/cretapark)
 *
 * @help
 * |                                                                  |
 * |         ===== ScreenGammaAdjuster_YanflyExtension =====          |
 * |                                                                  |
 * | This plugin helps to integrate ScreenGammaAdjuster plugin        |
 * | for Yanfly plugins.                                              |
 * | Created by Creta Park (https://creft.me/cretapark)               |
 * | License : MIT                                                    |
 * | GitHub page :                                                    |
 * |  https://github.com/creta5164/rpg-maker-mv-screen-gamma-adjuster |
 * | Recommanded MV version : 1.6.2^                                  |
 * | - How to setup ------------------------------------------------- |
 * | 1. Add this plugin right after ScreenGammaAdjuster in plugins    |
 * |    list like this.                                               |
 * | ---------------------------------------------------------------- |
 * | ScreenGammaAdjuster                 | ON       | ...             |
 * | ScreenGammaAdjuster_YanflyExtension | ON       | ...             |
 * | ...                                 |          |                 |
 * | YEP_OptionsCore                     | ON       | ...             |
 * | ...                                 |          |                 |
 * | ---------------------------------------------------------------- |
 * | 2. Open YEP_OptionsCore plugin settings.                         |
 * | 3. Goto Options Categories you want to add                       |
 * |    ScreenGammaAdjuster option.                                   |
 * | 4. Create new option.                                            |
 * | 5. Setting up like below by your ScreenGammaAdjuster setup.      |
 * |                                                                  |
 * | ### Default type : Adjusting brightness in options menu ######## |
 * |     If you disabled the 'Use exclusive screen' option            |
 * |     in ScreenGammaAdjuster.                                      |
 * |                                                                  |
 * | Name : Screen brightness                                         |
 * | [-] ---Settings---                                               |
 * | Help Description : Press left or right to change brightness.     |
 * |           Symbol : ScreenGammaAdjuster.Brightness                |
 * |        Show/Hide : show = true;                                  |
 * |           Enable : enabled = true;                               |
 * |              Ext : ext = 0;                                      |
 * | [-] ---Functions---                                              |
 * |    Make Option Code :                                            |
 * |        this.addCommand(name, symbol, enabled, ext);              |
 * |    Draw Option Code :                                            |
 * |        ScreenGammaAdjuster.YanflyExt_DrawDefault(this, index);   |
 * |     Process OK Code :                                            |
 * |        //Nothing                                                 |
 * |   Cursor Right Code :                                            |
 * |        ScreenGammaAdjuster.OptionWindow_CursorRight(this);       |
 * |    Cursor Left Code :                                            |
 * |        ScreenGammaAdjuster.OptionWindow_CursorLeft(this);        |
 * | Default Config Code :                                            |
 * |        //Nothing                                                 |
 * |    Save Config Code :                                            |
 * |        ScreenGammaAdjuster.CreateConfigData(config);             |
 * |    Load Config Code :                                            |
 * |        ScreenGammaAdjuster.ApplyFromConfig(config);              |
 * |                                                                  |
 * | ### Exclusive type : Adjusting brightness in dedicated screen ## |
 * |     If you enabled the 'Use exclusive screen' option             |
 * |     in ScreenGammaAdjuster.                                      |
 * |                                                                  |
 * | Name : Change screen brightness                                  |
 * | [-] ---Settings---                                               |
 * | Help Description : Press OK to start change screen brightness.   |
 * |           Symbol : ScreenGammaAdjuster.ChangeBrightness          |
 * |        Show/Hide : show = true;                                  |
 * |           Enable : enabled = true;                               |
 * |              Ext : ext = 0;                                      |
 * | [-] ---Functions---                                              |
 * |    Make Option Code :                                            |
 * |        this.addCommand(name, symbol, enabled, ext);              |
 * |    Draw Option Code :                                            |
 * |        ScreenGammaAdjuster.YanflyExt_DrawExclusive(this, index); |
 * |     Process OK Code :                                            |
 * |        ScreenGammaAdjuster.OpenExclusiveScreen();                |
 * |   Cursor Right Code :                                            |
 * |        //Nothing                                                 |
 * |    Cursor Left Code :                                            |
 * |        //Nothing                                                 |
 * | Default Config Code :                                            |
 * |        //Nothing                                                 |
 * |    Save Config Code :                                            |
 * |        //Nothing                                                 |
 * |    Load Config Code :                                            |
 * |        //Nothing                                                 |
 * | ---------------------------------------------------------------- |
 * |                                                                  |
 */

if (typeof(ScreenGammaAdjuster) === undefined)
    throw "Dependency 'ScreenGammaAdjuster' not found.";

(function() {
    
    ScreenGammaAdjuster.YanflyExt_DrawDefault = function(context, index) {
        
        if (ScreenGammaAdjuster._useExclusiveScreen) {
            
            Graphics.printError(
                "ScreenGammaAdjuster in YEP_OptionsCore has invalid setup.",
                "<b style='color:fuchsia'>Use exclusive screen</b> are enabled but<br/>"
              + "<b style='color:fuchsia'>ScreenGammaAdjuster.YanflyExt_DrawDefault</b> are used.<br/>"
              + "Please follow extension plugin instructions<br/>"
              + "and check your <b style='color:fuchsia'>YEP_OptionsCore</b> plugin parameters."
            );
            
            SceneManager.stop();
            
            return;
        }
        
        var rect = context.itemRectForText(index);

        context.resetTextColor();
        context.changePaintOpacity(context.isCommandEnabled(index));
        
        context.drawOptionsName(index);
       
        var min = ScreenGammaAdjuster.MIN_BRIGHTNESS;
        var max = ScreenGammaAdjuster.MAX_BRIGHTNESS;
        
        var value = ScreenGammaAdjuster.Brightness;
        
        context.drawOptionsGauge(
            index,
            (value - min) / (max - min),
            'white',
            'gray'
        );
        
        context.drawText(
            ScreenGammaAdjuster.Brightness.toString(),
            rect.width - context.statusWidth(),
            rect.y,
            context.statusWidth(),
            'center'
        );
    }
    
    ScreenGammaAdjuster.YanflyExt_DrawExclusive = function(context, index) {
        
        if (!ScreenGammaAdjuster._useExclusiveScreen) {
            
            Graphics.printError(
                "ScreenGammaAdjuster in YEP_OptionsCore has invalid setup.",
                "<b style='color:fuchsia'>Use exclusive screen</b> are disabled but<br/>"
              + "<b style='color:fuchsia'>ScreenGammaAdjuster.YanflyExt_DrawExclusive</b> are used.<br/>"
              + "Please follow extension plugin instructions<br/>"
              + "and check your <b style='color:fuchsia'>YEP_OptionsCore</b> plugin parameters."
            );
            
            SceneManager.stop();
            
            return;
        }
        
        var rect = context.itemRectForText(index);
        
        context.resetTextColor();
        context.changePaintOpacity(context.isCommandEnabled(index));
        
        context.drawText(
            context.commandName(index),
            rect.x,
            rect.y,
            rect.width,
            'center'
        );
    }
    
})();