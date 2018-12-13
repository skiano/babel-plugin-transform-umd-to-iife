**WORK IN PROGRESS**

# babel-plugin-transform-umd-to-iife

Take a UMD bundle and convert it to an `iife` and specify the globalName that is assigned.

## installation

```bash
npm install babel-plugin-transform-umd-to-iife --save-dev
```

### usage

```javascript
{
  plugins: [
    ['babel-plugin-transform-umd-to-iife'), { globalName: 'MyGlobalName' }],
  ],
}
```
### caveats

I tried to make this so it would work for common formats of umd, but I would not be surprised if some pacakges have issues. If you find examples of pacakges that do not work, let me know :)
