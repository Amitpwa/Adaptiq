'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens, masteryPalette } from '@/ui/tokens';
import type { GraphNodeView, GraphEdgeView } from '@/services/graph';

export type CustomConceptNodeData = {
  node: GraphNodeView;
  onSelect: (node: GraphNodeView) => void;
  [key: string]: unknown;
};

function ConceptCustomNode({ data }: NodeProps<Node<CustomConceptNodeData>>) {
  const { node, onSelect } = data;
  const palette = masteryPalette[node.band];

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect(node)}
      sx={{
        width: 190,
        p: 2,
        borderRadius: tokens.radius.md,
        border: 1.5,
        borderColor: palette.main,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(11, 31, 58, 0.05)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(11, 31, 58, 0.12)',
        },
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: palette.main, width: 8, height: 8 }} />
      <Stack spacing={1.25}>
        <MasteryDots band={node.band} value={node.effectiveMastery} height={36} labelled={false} />
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3 }}>
          {node.title}
        </Typography>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: palette.main, fontWeight: 700, fontSize: '0.75rem' }}>
            {palette.label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {Math.round(node.effectiveMastery * 100)}%
          </Typography>
        </Stack>
      </Stack>
      <Handle type="source" position={Position.Bottom} style={{ background: palette.main, width: 8, height: 8 }} />
    </Paper>
  );
}

const nodeTypes = {
  conceptNode: ConceptCustomNode,
};

export function KnowledgeGraph({
  nodes,
  edges,
  onSelectNode,
}: {
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
  onSelectNode: (node: GraphNodeView) => void;
}) {
  const flowNodes = useMemo(() => {
    return nodes.map((node) => {
      const x = node.order * 250 + 60;
      const y = node.rank * 190 + 40;

      return {
        id: node.id,
        type: 'conceptNode',
        position: { x, y },
        data: {
          node,
          onSelect: onSelectNode,
        },
      };
    });
  }, [nodes, onSelectNode]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((e, index) => ({
      id: `edge-${index}-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      animated: !e.satisfied,
      style: {
        stroke: e.satisfied ? tokens.color.mastered : tokens.color.border,
        strokeWidth: e.satisfied ? 2.5 : 1.5,
      },
    }));
  }, [edges]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 520,
        borderRadius: tokens.radius.lg,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: tokens.color.background,
        boxShadow: '0 4px 20px rgba(11, 31, 58, 0.04)',
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color={tokens.color.border} gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </Box>
  );
}
