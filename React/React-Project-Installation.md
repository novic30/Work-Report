Vite(https://vite.dev/guide/#scaffolding-your-first-vite-project):
```jsx
npm create vite@latest
```
If it shows script disabled, run powershell as admin and write:
```powershell
Get-ExecutionPolicy
```
Result is prob Restricted
Thus, DO:
```powershell
Set-ExecutionPolicy unrestricted
```
After downloading vite, it asks for project name which you put in and then you select framework to use as React.
Then You can choose variants like typescript, but we will do Javascript as variant so we can use JSX.

Next, we have to install npm modules:
```jsx
npm i
OR
npm install
```
Now, we can run the vite react project:
```jsx
npm run dev
```
