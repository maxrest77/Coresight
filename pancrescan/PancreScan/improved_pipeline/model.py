import torch
import torch.nn as nn
from torchvision import models

class SpatialAttention(nn.Module):
    """
    Computes a 2D spatial attention mask to force the model to look at critical 
    internal structures rather than generic noise or liver boundaries.
    """
    def __init__(self, kernel_size=7):
        super().__init__()
        padding = 3 if kernel_size == 7 else 1
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # Average and Max along the channel dimension
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        attention = torch.cat([avg_out, max_out], dim=1)
        attention = self.conv(attention)
        return x * self.sigmoid(attention)

class ResNetAttentionClassifier(nn.Module):
    def __init__(self, dropout_rate=0.5):
        super().__init__()
        # Pretrained efficient backbone
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        
        # Add the spatial attention bottleneck to restrict the receptive field
        self.spatial_attention = SpatialAttention()
        
        num_ftrs = self.backbone.fc.in_features
        # Adding Batch Normalization handled in ResNet internals.
        self.backbone.fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_ftrs, 1) 
        )

    def get_cam_features(self, x):
        """Allows extraction of spatial attention outputs for Grad-CAM++ mapping."""
        features = None
        def hook(module, input, output):
            nonlocal features
            features = output
            
        # Hook immediately after the spatial attention weights apply
        handle = self.backbone.layer4.register_forward_hook(hook)
        out = self.forward(x)
        handle.remove()
        return features, out

    def forward(self, x):
        # Perform partial forward pass mirroring ResNet
        x = self.backbone.conv1(x)
        x = self.backbone.bn1(x)
        x = self.backbone.relu(x)
        x = self.backbone.maxpool(x)

        x = self.backbone.layer1(x)
        x = self.backbone.layer2(x)
        x = self.backbone.layer3(x)
        x = self.backbone.layer4(x)
        
        # -> ATTENTION MECHANISM
        x = self.spatial_attention(x)
        
        x = self.backbone.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.backbone.fc(x)
        return x
