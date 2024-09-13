# Components

## DrawerItem

![DrawerItem (light)](docs/images/components/DrawerItem_light.png)
![DrawerItem (dark blue)](docs/images/components/DrawerItem_darkblue.png)
![DrawerItem (dark)](docs/images/components/DrawerItem_dark.png)

### Import

```js
import DrawerItem from './components/DrawerItem';
```

### Props

| Name         | Default | Description                            |
| ------------ | ------- | -------------------------------------- |
| icon         |         | The icon on the left side              |
| onClick      |         | Function that is called when clicking  |
| selected     |         | Indicates whether the item is selected |
| text         |         | Text to display                        |
| badgeContent | 0       | Content of the badge                   |
| badgeColor   | primary | Color of the badge                     |

### Example

```js
<DrawerItem text="Logs" selected={false} badgeContent={11} badgeColor={'error'} />
```

## IntroCard

![IntroCard (light)](docs/images/components/IntroCard_light.png)
![IntroCard (dark blue)](docs/images/components/IntroCard_darkblue.png)
![IntroCard (dark)](docs/images/components/IntroCard_dark.png)

### Import

```js
import IntroCard from './components/IntroCard';
```

### Props

| Name             | Default | Description                                                                         |
| ---------------- | ------- | ----------------------------------------------------------------------------------- |
| title            |         | The title of the card                                                               |
| children         |         | The child elements                                                                  |
| image            |         | The image to display on the left                                                    |
| color            | #e2e2e2 | The color to display as the background of the image                                 |
| action           |         | Link and text {link: 'https://example.com', text: 'example.com'}                    |
| reveal           |         | Element or text that should be displayed in the reveal element using an info button |
| enabled          |         | State of the card                                                                   |
| edit             |         | Editing mode active                                                                 |
| toggleActivation |         | Function for switching the status                                                   |
