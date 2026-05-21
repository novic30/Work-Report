```bash
# Make the project folder/repositry which will be initialized
mkdir my-cool-project
cd my-cool-project
git init # Turns this folder into tracked git project folder

echo "Basic Info about Project" > README.md
git add README.md # To add it to staging
git commit -m "README.md made" # Prepare commit which will be pushed to github

git branch -M main # Creates main branch similar to when creating it using web interface

# Connect git to github Finally
gh repo create my-cool-project --public --source=. --remote=origin --push
git remote add origin https://github.com/novic30/my-cool-project.git
git push -u origin main
