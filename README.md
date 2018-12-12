# babel-plugin-transform-umd-to-iife

Take a UMD bundle and convert it to an `iife` and specify the globalName that is assigned.

### usage

```javascript
{
  plugins: [
    ['babel-plugin-transform-umd-to-iife'), { globalName: 'MyGlobalName' }],
  ],
}
```
