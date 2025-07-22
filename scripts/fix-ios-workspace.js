
const fs = require('fs');
const path = require('path');

// Paths
const workspacePath = path.join(__dirname, '../ios/App/App.xcworkspace');
const contentsPath = path.join(workspacePath, 'contents.xcworkspacedata');
const xcodeProjectPath = path.join(__dirname, '../ios/App/App.xcodeproj');

// Make sure workspace directory exists
if (!fs.existsSync(workspacePath)) {
  console.log('Creating workspace directory...');
  fs.mkdirSync(workspacePath, { recursive: true });
}

// XML content for contents.xcworkspacedata
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:App.xcodeproj">
   </FileRef>
   <FileRef
      location = "group:Pods/Pods.xcodeproj">
   </FileRef>
</Workspace>
`;

// Write the contents file
fs.writeFileSync(contentsPath, xmlContent, 'utf8');
console.log('Successfully created contents.xcworkspacedata!');

// Verify Xcode project exists
if (!fs.existsSync(xcodeProjectPath)) {
  console.log('Warning: App.xcodeproj not found! You may need to run "npx cap add ios" first.');
} else {
  console.log('Xcode project exists. Workspace should be valid now.');
}

// Verify the workspace structure
if (fs.existsSync(contentsPath)) {
  console.log('Workspace structure verified. You can now open Xcode with:');
  console.log('npx cap open ios');
} else {
  console.log('Error: Failed to create workspace file!');
}
