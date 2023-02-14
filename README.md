# CPM-animation-plugin
This is a blockbench plugin to generate custom player model animation file from blockbench (bedrock format) animation.  
Another functionality is allows to have _c bone that are not root bone (and remove _c bone animation but this isn't recommended).  

The expected format is based on the format wanted by 'yes Steve model' mod.

# HOW TO USE

Once the plugin is installed, in file->export, an option called 'Export CPM animation' will appear.  
On click, a popup will appear (discussed on section about _c bones) and then you will be asked where to save the file. For cpm to load the file, it must be named 'animation.js' and be placed in the same folder as your model.  
It will create a JavaScript file with the animations that are loaded in blockbench.

## Animations

For your animation to be exported and played, it must be name according to the following list (!case sensitive!)


~15 animations

- walk : use when walking (on ground and not sprinting and not in water)  
- run : use when sprinting on ground (same condition as walk)  
- climbing : use when crawling (don't ask)  
- sneaking : use when crouching but not moving (not in water)  
- sneak : use when walking while crouching (not in water)  
- swim : use when swimming  
- swim_stand : use when in water but not swimming  
- attacked : use when receiving damage (override all other animation when used)  
- jump : use when jumping / flying in creative (not in water)  
- fly : use when flying with elytra  
- boat / ride / ride_pig / sit : use for when the player is riding something, there are 4 possible name but only one of them will be use if multiples are present  
- use_righthand : use when attacking  
- use_lefthand : currently deactivated but still converted  
- sleep : use when in bed  
- idle : use when not moving on the ground (not in water)  
- default : use if no other animation are currently running



**all animations are optional**. If no animation is available, the model will take the pose it have in the edit page of blockbench.  
**all of the animation** must use linear interpolation on every point, and are all loop animation (or animation of length 0s)

## _c bones
CPM use bone ending in _c to find important bones like body_c, head_c, left_arm_c, right_leg_c etc... These bones are used to add Minecraft default animation
For them to work, they need to be named exactly like the mod expect and need to have no parents.

When exporting, the popup will show the _c bones and tells you if they are present and if they are root. If it finds a _c bone that is not in a valid position, it will ask if you want to add the default animation to those bones. They will be added on top of every animation (and even if no animation is played, it will be added; useful if you want you head be child of another bone)

If _c bones are present and have their animation, it will be played on top of all the animation you added in blockbench.  
If you don't want that, you can either have you bone not exist in the model or place them in another bone (or have a different name). They aren't required for the model to load. (i recommend only leaving head_c and adding the animation because it is the head moving with you mouse)

I also not recommend doing any animation on _c bones (especially if you add the default animation from the export popup).

# Common issues
The animation jumps / some rotation are wrong:  
Save your model, your animation, close the project, reopen it, unload and reload all animation and re-export the animation.  

Some part disappear sometime / in certain animation:  
Make sure all your keyframes use linear interpolation and that all the value are clear value (not some equation like '12+5' or '0-25').

Limbs are displaced / at the wrong position:  
You might be doing animation on a _c bone, I recommend adding a bone in the _c bone and toing the animation on that.
