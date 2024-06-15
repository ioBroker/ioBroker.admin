import _ from 'lodash';

const funcSet = _.throttle(
    (setTabs, tabs) => setTabs(tabs),
    200,
);

const findCard = (id: string, cards: { name: string }[]) => {
    const card = cards.find(c => c.name === id);
    return {
        card,
        index: cards.indexOf(card),
    };
};

const moveCard = (
    id: string,
    atIndex: number, // index of the card being dragged
    tabs: { name: string }[],
    setTabs: (newTabs: { name: string }[]) => void,
    hoverClientY: number,
    hoverMiddleY: number,
) => {
    const { card, index } = findCard(id, tabs);
    if (index === atIndex) {
        return;
    }
    if (index < atIndex && hoverClientY < hoverMiddleY) {
        return;
    }
    if (index > atIndex && hoverClientY > hoverMiddleY) {
        return;
    }
    if (card && index !== atIndex) {
        const copyCard = JSON.parse(JSON.stringify(tabs));
        copyCard.splice(index, 1);
        copyCard.splice(atIndex, 0, card);
        funcSet(setTabs, copyCard);
    }
};

export { moveCard, findCard };
