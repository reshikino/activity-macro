# Activity Macro for Foundry VTT

**Activity Macro** is a module for Foundry Virtual Tabletop (VTT) designed for the **Dungeons & Dragons 5e** system. It allows you to create macros for any activity and trigger them when a specific activity is used, rather than relying on macros tied to items or abilities as a whole.

## Features

- **Create Macros for Activities**: Assign macros to specific activities in D&D 5e.
- **Trigger Macros When Activating Activities**: Execute the macro when the corresponding activity is used.
- **Enhanced Control**: Provides better control for macros, allowing more specific automation for character actions in the game.

## Installation

To install **Activity Macro**, follow these steps:

1. Go to your Foundry VTT instance.
2. Open the **Configuration and Setup** menu.
3. Go to **Add-on Modules** and click on the **Install Module** button.
4. In the URL field, enter the following link for the manifest:
   
   - **For the latest release**:
     ```
     https://github.com/reshikino/activity-macro/releases/latest/download/module.json
     ```


5. Click **Install** to download and install the module.

After the installation is complete, activate the module in the **Module Management** tab.

## Usage

Once the module is installed and activated, follow these steps to configure macros for activities:

1. Open an item sheet that contains activities.
2. Go to the **"Macros"** tab in the item sheet.
3. You will see a list of available activities. For each activity, you can assign a macro.
4. Type in the name of the macro or use the search field to find the desired macro.
5. Save the changes and trigger the macros when the respective activity is used.

   
IMPORTANT: Make sure that the macro is accessible to the player. If the player does not have permission to access the macro, it will not be able to trigger the assigned macro during the activity.


## Example

Let's say you have an item with an activity called "Swing Sword." You can assign a macro that will be executed whenever this activity is triggered, such as a damage roll or special effect.


## Arguments

When writing a macro to be executed with an activity, you will have access to the following arguments:
- `activity`: The activity object that triggers this macro
- `item`: The item object that holds the activity
- `concentration`: The concentration config, in case you need the concentration ID for anything
- `results`: An object with varied data that are a result of using the activity, such as created templates, or the chat message.

## Compatibles
- `Tidy5e Sheet v10.1.1 `
## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for more information.

## Authors

- **reshikino**  
  - GitHub: [reshikino](https://github.com/reshikino)  
  - Discord: [reshikino#5514](https://discord.com/users/reshikino#5514)

