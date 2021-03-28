'use strict';

goog.provide('Blockly.JavaScript.Sendto');

goog.require('Blockly.JavaScript');

// --- ifttt --------------------------------------------------
Blockly.Words['ifttt_iot']           = {'en': 'Send text to IFTTT via iot',  'de': 'Sende Text zu IFTTT über iot',       'ru': 'Послать текст в IFTTT через iot'};
Blockly.Words['ifttt_event']         = {'en': 'event',                       'de': 'event',                              'ru': 'event'};
Blockly.Words['ifttt_value1']        = {'en': 'value1',                      'de': 'value1',                             'ru': 'value1'};
Blockly.Words['ifttt_value2']        = {'en': 'value2',                      'de': 'value2',                             'ru': 'value2'};
Blockly.Words['ifttt_value3']        = {'en': 'value3',                      'de': 'value3',                             'ru': 'value3'};
Blockly.Words['ifttt_tooltip']       = {'en': 'Send to IFTTT',               'de': 'Sende zu IFTTT',                     'ru': 'Послать в IFTTT'};
Blockly.Words['ifttt_help']          = {'en': 'https://github.com/ioBroker/ioBroker.cloud/blob/master/README.md', 'de': 'http://www.iobroker.net/?page_id=178&lang=de', 'ru': 'http://www.iobroker.net/?page_id=4262&lang=ru'};

Blockly.Words['ifttt_log']           = {'en': 'log level',                   'de': 'Loglevel',                           'ru': 'Протокол'};
Blockly.Words['ifttt_log_none']      = {'en': 'none',                        'de': 'keins',                              'ru': 'нет'};
Blockly.Words['ifttt_log_info']      = {'en': 'info',                        'de': 'info',                               'ru': 'инфо'};
Blockly.Words['ifttt_log_debug']     = {'en': 'debug',                       'de': 'debug',                              'ru': 'debug'};
Blockly.Words['ifttt_log_warn']      = {'en': 'warning',                     'de': 'warning',                            'ru': 'warning'};
Blockly.Words['ifttt_log_error']     = {'en': 'error',                       'de': 'error',                              'ru': 'ошибка'};


// this is copy of engines.js
// Blockly.Sendto is global variable and defined in javascript/admin/google-blockly/own/blocks_sendto.js

Blockly.Sendto.blocks['ifttt_iot'] =
    '<block type="ifttt_iot">'
    + '     <value name="INSTANCE">'
    + '     </value>'
    + '     <value name="EVENT">'
    + '         <shadow type="text">'
    + '             <field name="TEXT">state</field>'
    + '         </shadow>'
    + '     </value>'
    + '     <value name="VALUE1">'
    + '         <shadow type="text">'
    + '             <field name="TEXT">value1</field>'
    + '         </shadow>'
    + '     </value>'
    + '     <value name="VALUE2">'
    + '         <shadow type="text">'
    + '             <field name="TEXT">value2</field>'
    + '         </shadow>'
    + '     </value>'
    + '     <value name="VALUE3">'
    + '         <shadow type="text">'
    + '             <field name="TEXT">value3</field>'
    + '         </shadow>'
    + '     </value>'
    + '     <value name="LOG">'
    + '     </value>'
    + '</block>';

Blockly.Blocks['ifttt_iot'] = {
    init: function() {
        var options = [];
        if (typeof main !== 'undefined' && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                var m = main.instances[i].match(/^system.adapter.iot.(\d+)$/);
                if (m) {
                    var n = parseInt(m[1], 10);
                    options.push(['iot.' + n, '.' + n]);
                }
            }
            if (!options.length) {
                for (var k = 0; k <= 4; k++) {
                    options.push(['iot.' + k, '.' + k]);
                }
            }
        } else {
            for (var u = 0; u <= 4; u++) {
                options.push(['iot.' + u, '.' + u]);
            }
        }

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Words['ifttt_iot'][systemLang])
            .appendField(new Blockly.FieldDropdown(options), 'INSTANCE');

        this.appendValueInput('EVENT')
            .appendField(Blockly.Words['ifttt_event'][systemLang]);

        var input = this.appendValueInput('VALUE1')
            .appendField(Blockly.Words['ifttt_value1'][systemLang]);
        if (input.connection) input.connection._optional = true;

        input = this.appendValueInput('VALUE2')
            .appendField(Blockly.Words['ifttt_value2'][systemLang]);
        if (input.connection) input.connection._optional = true;

        input = this.appendValueInput('VALUE3')
            .appendField(Blockly.Words['ifttt_value3'][systemLang]);
        if (input.connection) input.connection._optional = true;

        this.appendDummyInput('LOG')
            .appendField(Blockly.Words['ifttt_log'][systemLang])
            .appendField(new Blockly.FieldDropdown([
                [Blockly.Words['ifttt_log_none'][systemLang],  ''],
                [Blockly.Words['ifttt_log_info'][systemLang],  'log'],
                [Blockly.Words['ifttt_log_debug'][systemLang], 'debug'],
                [Blockly.Words['ifttt_log_warn'][systemLang],  'warn'],
                [Blockly.Words['ifttt_log_error'][systemLang], 'error']
            ]), 'LOG');

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Words['ifttt_tooltip'][systemLang]);
        this.setHelpUrl(Blockly.Words['ifttt_help'][systemLang]);
    }
};

Blockly.JavaScript['ifttt_iot'] = function(block) {
    var dropdown_instance = block.getFieldValue('INSTANCE');
    var event = Blockly.JavaScript.valueToCode(block, 'EVENT', Blockly.JavaScript.ORDER_ATOMIC);
    var logLevel = block.getFieldValue('LOG');
    var value1  = Blockly.JavaScript.valueToCode(block, 'VALUE1', Blockly.JavaScript.ORDER_ATOMIC);
    var value2  = Blockly.JavaScript.valueToCode(block, 'VALUE2', Blockly.JavaScript.ORDER_ATOMIC);
    var value3  = Blockly.JavaScript.valueToCode(block, 'VALUE3', Blockly.JavaScript.ORDER_ATOMIC);

    var logText;
    if (logLevel) {
        logText = 'console.' + logLevel + '("ifttt_iot: " + ' + event + ');\n'
    } else {
        logText = '';
    }

    return 'sendTo("iot' + dropdown_instance + '", "ifttt", {event: ' + event  + ', value1: ' + value1 + ', value2: ' + value2 + ', value3: ' + value3 + '});\n' +
        logText;
};
