import _ from 'lodash';

const funcSet = _.throttle(
    (setTabs, tabs) => setTabs(tabs)
    , 200);

const moveCard = (id, atIndex, tabs, setTabs, hoverClientY, hoverMiddleY) => {
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
        funcSet(setTabs,copyCard);
    }
};

const findCard = (id, cards) => {
    const card = cards.find(c => c.name === id);
    return {
        card,
        index: cards.indexOf(card),
    };
};

export { moveCard, findCard };