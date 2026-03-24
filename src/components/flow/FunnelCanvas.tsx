"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react'

import type {
  Node,
  Edge,
  ReactFlowInstance
} from '@xyflow/react'

import FunnelNode from '../FunnelNode'
import { loadFunnel, saveFunnel } from '@/lib/storage'
import { FunnelNodeData } from '@/types/funnel'