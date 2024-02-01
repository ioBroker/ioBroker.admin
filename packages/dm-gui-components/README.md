# ReactJS component for ioBroker device manager
This component requires the [dm-utils](https://github.com/ioBroker/dm-utils) in adapter.

## Usage
```jsx
import React from 'react';
import DeviceList from '@iobroker/dm-gui-components';

...
render() {
   return <DeviceList
      socket={this.props.socket}
      selectedInstance="matter.0"
   />;
}
```
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

## Changelog
### **WORK IN PROGRESS**
* (foxriver76) update adapter-react-v5 version

### 0.0.10 (2023-12-14)
* (bluefox) Changed layout of the device list

### 0.0.7 (2023-12-14)
* (bluefox) Added alive flag

### 0.0.4 (2023-12-12)
* (bluefox) return the style of big cards

### 0.0.3 (2023-12-12)
* (bluefox) initial commit

## License
MIT License

Copyright (c) 2023 Jey Cee <iobroker@all-smart.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
