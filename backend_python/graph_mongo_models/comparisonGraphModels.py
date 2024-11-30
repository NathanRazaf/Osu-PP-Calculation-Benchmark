from mongoengine import Document, fields


class UserGraphModel(Document):
    username = fields.StringField(required=True, unique=True)
    graph = fields.StringField(required=True)
    createdAt = fields.DateTimeField(required=True)
    meta = {
        'indexes': [
            'username'
        ],
        'ordering': ['createdAt'],
        'collection': 'user_graphs'
    }


class BeatmapGraphModel(Document):
    beatmapId = fields.IntField(required=True, unique=True)
    graph = fields.StringField(required=True)
    createdAt = fields.DateTimeField(required=True)
    meta = {
        'indexes': [
            'beatmapId'
        ],
        'ordering': ['createdAt'],
        'collection': 'beatmap_graphs'
    }