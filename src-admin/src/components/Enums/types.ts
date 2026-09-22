import type { JSX } from 'react';

export interface EnumTreeItem {
    data: ioBroker.EnumObject | null;
    children: Record<string, EnumTreeItem>;
    id: string;
}

/** An enum dragged in the list of enums */
export interface DragEnumItem {
    enumId: string;
    preview?: JSX.Element;
}

/** A member dragged in the details of an enum */
export interface DragMemberItem {
    memberId: string;
    fromEnumId: string;
    preview?: JSX.Element;
}

/** Members to add to or remove from enums, by enum ID */
export type MemberChanges = Record<string, { add?: string[]; remove?: string[] }>;

/** Result of a drop on an enum. If a member is moved or copied, is decided in dragCopy.ts */
export interface EnumDropResult {
    enumId: string;
}

/**
 * Check if a dragged item (an object of the object browser, a member or an enum) can be dropped on the enum
 *
 * @param item dragged item
 * @param enumObj the enum under the pointer, null for a folder without an own object
 * @param enumId ID of the enum under the pointer
 */
export function canDropOnEnum(item: unknown, enumObj: ioBroker.EnumObject | null | undefined, enumId: string): boolean {
    if (!item || typeof item !== 'object') {
        return false;
    }
    const dragged = item as Partial<DragEnumItem & DragMemberItem> & { data?: { id?: string } };
    if (dragged.enumId) {
        // an enum cannot be moved into itself, into its own children or to the place where it is already
        const parentId = dragged.enumId.split('.').slice(0, -1).join('.');
        return dragged.enumId !== enumId && !enumId.startsWith(`${dragged.enumId}.`) && parentId !== enumId;
    }
    if (!enumObj) {
        return false;
    }
    const id = dragged.memberId || dragged.data?.id;
    return !!id && !enumObj.common?.members?.includes(id);
}

/**
 * Sort the tree items by their name
 *
 * @param items tree items
 * @param getName function to translate the name
 */
export function sortTreeItems(
    items: EnumTreeItem[],
    getName: (name: ioBroker.StringOrTranslated | undefined) => string,
): EnumTreeItem[] {
    const nameOf = (item: EnumTreeItem): string =>
        (getName(item.data?.common?.name) || item.id.split('.').pop() || '').toLowerCase();
    return [...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
}
