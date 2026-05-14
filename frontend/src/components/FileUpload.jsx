import React, { useState, useRef } from 'react'
import {
  Box, Typography, Button, LinearProgress, IconButton, Paper,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Chip
} from '@mui/material'
import {
  CloudUpload as UploadIcon, InsertDriveFile as FileIcon,
  Delete as DeleteIcon, Download as DownloadIcon, Image as ImageIcon,
  PictureAsPdf as PdfIcon, Code as CodeIcon, Description as TextIcon
} from '@mui/icons-material'

const getFileIcon = (type) => {
  switch (type) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <ImageIcon color="primary" />
    case 'pdf':
      return <PdfIcon color="error" />
    case 'py':
    case 'js':
    case 'html':
    case 'css':
    case 'json':
      return <CodeIcon color="action" />
    default:
      return <FileIcon color="action" />
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const FileUpload = ({ projectId, onFilesChange, maxFiles = 5, acceptedTypes }) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    if (files.length + fileArray.length > maxFiles) {
      alert(`Максимум ${maxFiles} файлов`)
      return
    }

    setUploading(true)
    const newFiles = []

    for (const file of fileArray) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId || '')

      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newFiles.push({
            id: Date.now() + Math.random(),
            name: data.original_name,
            url: data.url,
            size: data.size,
            type: data.type,
            tempId: data.filename
          })
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    setFiles(prev => [...prev, ...newFiles])
    setUploading(false)
    
    if (onFilesChange) {
      onFilesChange([...files, ...newFiles])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeFile = (fileId) => {
    const newFiles = files.filter(f => f.id !== fileId)
    setFiles(newFiles)
    if (onFilesChange) {
      onFilesChange(newFiles)
    }
  }

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragActive ? 'primary.50' : 'grey.50',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          accept={acceptedTypes}
          style={{ display: 'none' }}
        />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Отпустите файлы здесь' : 'Перетащите файлы сюда'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          или нажмите для выбора файлов
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Максимум {maxFiles} файлов
        </Typography>
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Загрузка файлов...
          </Typography>
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <List dense sx={{ mt: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                {getFileIcon(file.type)}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
                primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Chip label={file.type.toUpperCase()} size="small" sx={{ mr: 1 }} />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => removeFile(file.id)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Accepted Types Info */}
      {acceptedTypes && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Принимаются: {acceptedTypes}
        </Typography>
      )}
    </Box>
  )
}

export default FileUpload
