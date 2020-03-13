# Components
## IntroCard
![IntroCard (light)](docs/images/components/IntroCard_light.png)
![IntroCard (dark blue)](docs/images/components/IntroCard_darkblue.png)
![IntroCard (dark)](docs/images/components/IntroCard_dark.png)

### Import
```js
import IntroCard from './components/IntroCard';
```

### Props
| Name | Default | Description
| ------ | ------ | ------ |
| title |  | The title of the card
| children |  | The child elements
| image |  | The image to display on the left
| color | #e2e2e2 | The color to display as the background of the image
| action |  | Link and text {link: 'https://example.com', text: 'example.com'}
| reveal |  | Element or text that should be displayed in the reveal element using an info button
| enabled | | State of the card
| edit | | Editing mode active
| toggleActivation | | Function for switching the status