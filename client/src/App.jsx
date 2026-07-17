import { useState, useEffect } from 'react'
import NewInventory from './components/NewInventory'
import './App.css'

export default function App() {
  return (
    <div className="App">
      <NewInventory />
      console.log('bcrypt.hash('admin123', 12)')
    </div>
  )
}

