```bash
git clone <url-from-github-probably> # Clones repositry made in web interface or someone else's repositry and makes it your own for local development
git status # Will show untracked changes after you have done some work like creating new files or removing files.
git add newFile # Adds files which are not tracked
git add file1 file2 file3 # Add multiple files to staging quickly
git commit -m "commit message describing changings" # Saves the new changes into the project history
git log # Lists all the commit which have been made and states info like when and who made them
git diff main branch1 # Tells what changes you have made in branch1 compared to the main branch and display relevant changed code
git diff <commit_id_1> <commit_id_2> # Compares two commit to find out the changes that have been made and displays relevant code changes
git pull # Pulls if someone else has made changes to remote repositry on github or you made some changes directly through another interface.

git branch nameOfBranch # Creates a new branch where you could work on a specific feature.
git merge nameOfBranch # Merges the changes from the new branch into main branch

README.md # This is the file where the discription about the project and relevant instructions on how to use the project are stated which will appear when the project's github page is visited.
```

FORK # is when you make a copy of an open-source-project to work on it and hopefully do a pull-request with the improvement
1. Go to owner's repositry and click Fork on top right to copy it into your own repositry.
2. Use git clone to clone it for local dev
3. Make a branch like making-feature for the update you will make
4. Make changes in the making-feature branch and do add, commit and push by doing git push origin making-feature
5. Next, you will see option of compare & pull request where you would make a pull request like original-owner/project  <- your-username/project where the seperate branch still remains
6. Lastly, you would give discription for pull request where changes are in branch and the original owner would approve it or reject it. 
