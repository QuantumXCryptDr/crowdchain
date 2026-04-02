'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FloatingObject() {
  const blocksRef = useRef<THREE.Mesh[]>([])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    blocksRef.current.forEach((block, index) => {
      if (block) {
        block.rotation.x = Math.sin(time + index * 0.5) * 0.2
        block.rotation.y = Math.sin(time * 0.8 + index * 0.3) * 0.2
        block.position.y = Math.sin(time * 0.5 + index * 0.4) * 0.3
        // Deepest blue color
        const color = new THREE.Color()
        color.setHSL(0.6, 0.9, 0.1) // Deep blue
        ;(block.material as THREE.MeshStandardMaterial).color = color
      }
    })
  })

  const blocks = []
  const gridSize = 4
  const spacing = 2
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i - gridSize / 2) * spacing
      const z = (j - gridSize / 2) * spacing - 5
      blocks.push(
        <mesh
          key={`${i}-${j}`}
          ref={(el) => {
            if (el) blocksRef.current[i * gridSize + j] = el
          }}
          position={[x, 0, z]}
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial transparent opacity={0.4} color="#000080" />
        </mesh>
      )
    }
  }

  return <group>{blocks}</group>
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <FloatingObject />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}