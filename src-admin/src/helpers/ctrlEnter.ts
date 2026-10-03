import type React from 'react';

/**
 * Calls `onConfirm` if CTRL+ENTER (CMD+ENTER on mac) was pressed.
 *
 * Every dialog that writes something confirms with CTRL+ENTER, so the handler belongs to the dialog
 * itself and not to one of its inputs: the key then works wherever the focus is. An input that
 * handles the combination on its own stops the event, so nothing is written twice.
 *
 * @param e the keyboard event of the dialog
 * @param onConfirm the action of the confirming button of the dialog
 */
export function onCtrlEnter(e: React.KeyboardEvent, onConfirm: () => void): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
    }
}

/** Key binding of the CTRL+ENTER command for the ace editor */
export const CTRL_ENTER_KEY = { win: 'Ctrl-Enter', mac: 'Ctrl-Enter|Command-Enter' };
