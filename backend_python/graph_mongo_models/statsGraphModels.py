from mongoengine import Document, EmbeddedDocument, fields
from datetime import datetime


class ErrorStatsModel(Document):
    minPp = fields.FloatField(required=True)
    maxPp = fields.FloatField(required=True)
    mae = fields.ListField(fields.FloatField(), required=True)  # MAE values for each calculator
    rmse = fields.ListField(fields.FloatField(), required=True)  # RMSE values for each calculator
    mbe = fields.ListField(fields.FloatField(), required=True)  # MBE values for each calculator
    dataSize = fields.IntField(required=True)  # Number of data points used
    createdAt = fields.DateTimeField(default=datetime.now, required=True)
    
    meta = {
        'indexes': [
            {'fields': ['minPp', 'maxPp'], 'unique': True},  # Unique index for the pair
        ],
        'collection': 'errorStats'
    }


class OutlierModel(EmbeddedDocument):
    model = fields.StringField(required=True)
    actualPP = fields.FloatField(required=True)
    error = fields.FloatField(required=True)
    createdAt = fields.DateTimeField(default=datetime.now, required=True)
   

class OutlierDistributionGraphModel(Document):
    minPp = fields.FloatField(required=True)
    maxPp = fields.FloatField(required=True)
    errorThreshold = fields.FloatField(required=True)
    top200best = fields.ListField(fields.EmbeddedDocumentField(OutlierModel), default=[])
    top200worst = fields.ListField(fields.EmbeddedDocumentField(OutlierModel), default=[])
    createdAt = fields.DateTimeField(required=True)
    
    meta = {
        'indexes': [
            {'fields': ['minPp', 'maxPp', 'errorThreshold']},  # Compound index for frequent queries
        ],
        'ordering': ['createdAt'],
        'collection': 'outlierStats'
    }
    
    def add_outlier(self, new_outlier):
        """
        Add a new OutlierModel to the top200best and top200worst arrays, maintaining the top 200 for each.
        If the arrays are full, remove the least relevant outlier before adding the new one.
        """
        # Add to top200worst if the new outlier's error is higher than the smallest error in top200worst
        if len(self.top200worst) < 200 or new_outlier.error > self.top200worst[-1].error:
            self.top200worst.append(new_outlier)
            self.top200worst = sorted(self.top200worst, key=lambda x: -x.error)[:200]  # Sort by descending error
        
        # Add to top200best if the new outlier's error is lower than the highest error in top200best
        if len(self.top200best) < 200 or new_outlier.error < self.top200best[-1].error:
            self.top200best.append(new_outlier)
            self.top200best = sorted(self.top200best, key=lambda x: x.error)[:200]  # Sort by ascending error

            

