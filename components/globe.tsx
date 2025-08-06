'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function Globe() {
  const mountRef = useRef<HTMLDivElement>(null)
  const scene = useRef<THREE.Scene | null>(null)
  const camera = useRef<THREE.PerspectiveCamera | null>(null)
  const renderer = useRef<THREE.WebGLRenderer | null>(null)
  const controls = useRef<OrbitControls | null>(null)
  const globe = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    scene.current = new THREE.Scene()
    camera.current = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    renderer.current = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.current.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.current.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(5, 5, 5).normalize()
    scene.current.add(directionalLight)

    // OrbitControls
    controls.current = new OrbitControls(camera.current, renderer.current.domElement)
    controls.current.enableDamping = true
    controls.current.dampingFactor = 0.05
    controls.current.enableZoom = true
    controls.current.enablePan = false
    controls.current.autoRotate = true
    controls.current.autoRotateSpeed = 0.5

    camera.current.position.z = 2.5

    // Load GLB model (placeholder for a globe model)
    const loader = new GLTFLoader()
    loader.load(
      '/placeholder.glb?query=simple-globe-model', // Placeholder GLB URL
      (gltf) => {
        globe.current = gltf.scene
        globe.current.scale.set(1, 1, 1) // Adjust scale as needed
        scene.current?.add(globe.current)
      },
      undefined,
      (error) => {
        console.error('An error occurred while loading the GLB model:', error)
        // Fallback to a simple sphere if GLB fails
        const geometry = new THREE.SphereGeometry(1, 32, 32)
        const material = new THREE.MeshPhongMaterial({ color: 0x0077ff, transparent: true, opacity: 0.8 })
        globe.current = new THREE.Mesh(geometry, material) as unknown as THREE.Group; // Cast to Group for consistency
        scene.current?.add(globe.current)
      }
    )

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.current?.update()
      if (globe.current) {
        // Optional: add subtle rotation if autoRotate is off or for additional effect
        // globe.current.rotation.y += 0.001;
      }
      renderer.current?.render(scene.current!, camera.current!)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && camera.current && renderer.current) {
        camera.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
        camera.current.updateProjectionMatrix()
        renderer.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.current) {
        mountRef.current.removeChild(renderer.current.domElement)
        renderer.current.dispose()
      }
      controls.current?.dispose()
      scene.current?.clear()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full" aria-label="3D Globe Visualization" />
}
