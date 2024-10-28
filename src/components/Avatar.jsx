import React, { useEffect, useRef } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import * as THREE from 'three'

export function Avatar(props) {
  const { animation = 'Standing' , wireframe,domain} = props;
  const group = useRef();
  const currentAnimation = useRef(null);
  const mixer = useRef(null);
  
  const {
    headFollow,
    cursorFollow,
   
  } = useControls({
    headFollow: false,
    cursorFollow: false,
    
  })

  const getDressByDomain = () => {
    if (domain === 'web') {
      return 'web'
    }
    else if (domain === 'app') {
      return 'app'
    }
    else{
      return 'web'
    }
  }

  const dress = getDressByDomain()
  

  const { scene } = useGLTF(`models/${dress}.glb`)
  const clone = React.useMemo(() => {
    const clonedScene = SkeletonUtils.clone(scene)
    return clonedScene
  }, [scene])
  
  const { nodes, materials } = useGraph(clone)

  const { animations: typingAnimation } = useFBX("animations/Typing.fbx")
  const { animations: standingAnimation } = useFBX("animations/Standing.fbx")
  const { animations: fallingAnimation } = useFBX("animations/Falling.fbx")

  // Process animations with corrected transforms
  const processedAnimations = React.useMemo(() => {
    const processAnimation = (anim, name) => {
      const processed = anim[0].clone()
      processed.name = name

      // Adjust typing animation specifically
      if (name === 'Typing') {
        processed.tracks = processed.tracks.map(track => {
          // Keep original track but adjust values if needed
          if (track.name.includes('Spine') || track.name.includes('Neck')) {
            const values = [...track.values]
            // Adjust values to maintain proper posture
            for (let i = 0; i < values.length; i += 4) {
              values[i] *= 0.7   // Reduce rotation intensity
              values[i + 1] *= 0.7
              values[i + 2] *= 0.7
            }
            return new THREE.QuaternionKeyframeTrack(
              track.name,
              track.times,
              values
            )
          }
          return track
        })
      }

      return processed
    }

    return [
      processAnimation(typingAnimation, 'Typing'),
      processAnimation(standingAnimation, 'Standing'),
      processAnimation(fallingAnimation, 'Falling')
    ]
  }, [typingAnimation, standingAnimation, fallingAnimation])

  const { actions, mixer: newMixer } = useAnimations(processedAnimations, group)
  
  useEffect(() => {
    mixer.current = newMixer
  }, [newMixer])

  // Handle animation transitions
  useEffect(() => {
    if (!actions || !actions[animation]) return

    const setupAnimation = () => {
      const nextAction = actions[animation]
      const duration = 0.5 // transition duration

      if (currentAnimation.current && currentAnimation.current !== nextAction) {
        const prevAction = currentAnimation.current
        
        // Special handling for typing animation
        if (animation === 'Typing') {
          // Reset character pose before starting typing animation
          
          // Ensure proper transition to typing pose
          nextAction.reset()
          nextAction.setEffectiveTimeScale(1)
          nextAction.setEffectiveWeight(1)
          nextAction.crossFadeFrom(prevAction, duration, true)
          nextAction.play()
        } else {
          // Standard transition for other animations
          prevAction.fadeOut(duration)
          nextAction.reset()
          nextAction.fadeIn(duration)
          nextAction.play()
        }
      } else {
        // First animation
        nextAction.reset()
        nextAction.fadeIn(duration)
        nextAction.play()
      }
      
      currentAnimation.current = nextAction
    }

    setupAnimation()

    return () => {
      if (currentAnimation.current) {
        currentAnimation.current.fadeOut(0.5)
      }
    }
  }, [animation, actions])

  // Handle wireframe changes
  useEffect(() => {
    Object.values(materials).forEach((material) => {
      if (material) {
        material.wireframe = wireframe
        material.needsUpdate = true
      }
    })
  }, [wireframe, materials])

  // Handle head and cursor following
  useFrame((state) => {
    if (!group.current) return

    if (headFollow) {
      const head = group.current.getObjectByName("Wolf3D_Head")
      if (head) {
        const target = new THREE.Vector3()
        target.copy(state.camera.position)
        head.lookAt(target)
        head.rotation.x = THREE.MathUtils.clamp(head.rotation.x, -0.5, 0.5)
        head.rotation.y = THREE.MathUtils.clamp(head.rotation.y, -0.5, 0.5)
      }
    }

    if (cursorFollow) {
      const spine2 = group.current.getObjectByName("Spine2")
      if (spine2) {
        const target = new THREE.Vector3(
          state.mouse.x * 2,
          state.mouse.y * 2,
          1
        )
        spine2.lookAt(target)
        spine2.rotation.x = THREE.MathUtils.clamp(spine2.rotation.x, -0.5, 0.5)
        spine2.rotation.y = THREE.MathUtils.clamp(spine2.rotation.y, -0.5, 0.5)
      }
    }
  })

  return (
    <group {...props} dispose={null} ref={group} rotation={[0,-1,0]}>
      <primitive object={nodes.Hips} />
      
        
          <skinnedMesh 
        geometry={nodes.Wolf3D_Body.geometry} 

        material={materials.Wolf3D_Body} 

        skeleton={nodes.Wolf3D_Body.skeleton} 

        frustumCulled={false}
      />
    
      
      <skinnedMesh 
        geometry={nodes.Wolf3D_Hair.geometry} 
        material={materials.Wolf3D_Hair} 
        skeleton={nodes.Wolf3D_Hair.skeleton} 
        frustumCulled={false}
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry} 
        material={materials.Wolf3D_Outfit_Bottom} 
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} 
        frustumCulled={false}
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry} 
        material={materials.Wolf3D_Outfit_Footwear} 
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} 
        frustumCulled={false}
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Top.geometry} 
        material={materials.Wolf3D_Outfit_Top} 
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton} 
        frustumCulled={false}
      />
      <skinnedMesh 
        name="EyeLeft" 
        geometry={nodes.EyeLeft.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeLeft.skeleton} 
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} 
        frustumCulled={false}
      />
      <skinnedMesh 
        name="EyeRight" 
        geometry={nodes.EyeRight.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeRight.skeleton} 
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} 
        frustumCulled={false}
      />
      <skinnedMesh 
        name="Wolf3D_Head" 
        geometry={nodes.Wolf3D_Head.geometry} 
        material={materials.Wolf3D_Skin} 
        skeleton={nodes.Wolf3D_Head.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} 
        frustumCulled={false}
      />
      <skinnedMesh 
        name="Wolf3D_Teeth" 
        geometry={nodes.Wolf3D_Teeth.geometry} 
        material={materials.Wolf3D_Teeth} 
        skeleton={nodes.Wolf3D_Teeth.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} 
        frustumCulled={false}
      />
    </group>
  )
}

useGLTF.preload('models/avatar.glb')
useGLTF.preload('models/app.glb')
useGLTF.preload('models/web.glb')
useFBX.preload("animations/Typing.fbx");
useFBX.preload("animations/Standing Idle.fbx");
useFBX.preload("animations/Falling Idle.fbx");