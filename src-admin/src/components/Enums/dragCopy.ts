import { useSyncExternalStore } from 'react';

/*
 * A member dragged onto another enum is moved there. With the Shift, Ctrl or Alt key pressed, it is copied instead:
 * it stays in its enum too. The HTML5 backend of react-dnd only knows the ALT key, so the keys are read here
 * from the drag events. On touch devices, there are no drag events and a member is always moved.
 */

let copy = false;
const listeners = new Set<() => void>();

function setCopy(value: boolean): void {
    if (copy !== value) {
        copy = value;
        listeners.forEach(listener => listener());
    }
}

function onDragEventCapture(e: DragEvent): void {
    setCopy(e.shiftKey || e.ctrlKey || e.altKey);
}

/** Runs after the listener of the HTML5 backend, which sets the drop effect "move" over an enum */
function onDragEvent(e: DragEvent): void {
    // the cursor shows a plus sign
    if (copy && e.dataTransfer?.dropEffect === 'move') {
        e.dataTransfer.dropEffect = 'copy';
    }
}

/** Call it when the drag of a member starts */
export function startMemberDrag(): void {
    setCopy(false);
    ['dragenter', 'dragover', 'drop'].forEach(type =>
        window.addEventListener(type, onDragEventCapture as EventListener, true),
    );
    ['dragenter', 'dragover'].forEach(type => window.addEventListener(type, onDragEvent as EventListener));
}

/**
 * Call it when the drag of a member ends
 *
 * @returns true if the member must be copied and not moved
 */
export function endMemberDrag(): boolean {
    ['dragenter', 'dragover', 'drop'].forEach(type =>
        window.removeEventListener(type, onDragEventCapture as EventListener, true),
    );
    ['dragenter', 'dragover'].forEach(type => window.removeEventListener(type, onDragEvent as EventListener));
    const result = copy;
    setCopy(false);
    return result;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** True while the dragged member would be copied */
export function useCopyOnDrop(): boolean {
    return useSyncExternalStore(subscribe, () => copy);
}
