#Import all the necessary packages

import spacy
import pandas as pd
import nltk
import string
import warnings
import csv
import matplotlib.pyplot as plt
import re
import networkx as nx
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import NMF
from sklearn.metrics import silhouette_score
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords, wordnet
from sklearn.cluster import KMeans
from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
from wordcloud import WordCloud, STOPWORDS

nltk.download('wordnet')
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Suppress all warnings
warnings.filterwarnings("ignore")


#Let's consider Imdb review for this excercise
movie_reviews = ['This show was an amazing, fresh & innovative idea in the 70\'s when it first aired. The first 7 or 8 years were brilliant, but things dropped off after that. By 1990, the show was not really funny anymore, and it\'s continued its decline further to the complete waste of time it is today.<br /><br />It\'s truly disgraceful how far this show has fallen. The writing is painfully bad, the performances are almost as bad - if not for the mildly entertaining respite of the guest-hosts, this show probably wouldn\'t still be on the air. I find it so hard to believe that the same creator that hand-selected the original cast also chose the band of hacks that followed. How can one recognize such brilliance and then see fit to replace it with such mediocrity? I felt I must give 2 stars out of respect for the original cast that made this show such a huge success. As it is now, the show is just awful. I can\'t believe it\'s still on the air.',
                 'I greatly enjoyed Margaret Atwood\'s novel \'The Robber Bride\', and I was thrilled to see there was a movie version. A woman frames a cop boyfriend for her own murder, and his buddy, an ex-cop journalist, tries to clear his name by checking up on the dead woman\'s crazy female friends. It\'s fortunate that the movie script fixes Ms. Atwood\'s clumsy plotting by focusing on the story of these two men, victims of scheming women...<br /><br />Heh. Okay, you got me. If these guys are mentioned in the book, and I\'m pretty sure they\'re entirely made up for the movie, I\'ll eat the dust cover of my hardback copy. Apparently, the three main female characters of the novel aren\'t enough to carry the movie. Zenia\'s manipulations aren\'t interesting unless we see them happen to a man, and a man\'s life is screwed up. Roz, Charis, and Toni tell their stories -- to a man. Because it\'s not important if a man doesn\'t hear them.<br /><br />I liked the characters in the book. It hurts to see them pushed off to the side for a man\'s story. I normally do not look for feminist angles on media, and I tried to enjoy the movie as is. If I hadn\'t read the book, I might have enjoyed the movie a lot more. So if you like the cop and the ex-cop, and you want to read more about them, you\'re out of luck. Read the novel, if you want to enjoy luscious prose and characterization subtly layered through a plot. It\'s the same plot: the movie excavated it, ironed it, and sprinkled it with male angst. It\'s like Zenia\'s revenge on Margaret Atwood.',
                 'I am so happy and surprised that there is so much interest in this movie! Jack Frost was my introduction into the films produced and distributed by A-pix entertainment, and without exception, everything this company deals with is pure crap! First, and this is very important, never ever watch this movie sober! Why would you? Unlike many other entertaingly bad movies, this one I feel was made intentionally bad. I just can\'t get over how fake the snowman is, which is why its always shown only briefly, the way it moves is the best! This movie is Waaaaaaaaaaay better than the Michael Keaton piece of crap, becuz that was made too be a good movie, and that version is as bad as this.',
                 'This movie was one of the best movies that I have seen this year. I didn\'t see any cameos in the movie, but it is still pretty good. It is similar to Anchorman in the humor department, but I think this is a better put together movie. It actually has a point. If you are going to see a whole bunch of T&A you will be disappointed. Just a well put together movie!!!! If you have nothing to do for the day or you need a lot of humor, you will find this to be a really good movie. I definitely think that Ebert and Roeper\'s review of this movie is right on. I mean, I don\'t really like Ebert on most movies, but this is the movie that I will agree about. The movie contains a good enough story that it is actually believable that these type of people are out there. There is definitely something to be said about how they treat virginity in this movie. Yea, sure, you get laughed at when it is found out about, but it still suggests that you wait. Steve did a wonderful job of portraying the person that he did in this movie and yet, it is still funny.',
                 'I just watched the DVD of this award winning film. One Life Stand is a stark drama that through it\'s pace, black and white shots and atmospheric music, paints a very compelling and honest picture. It\'s a story about life\'s dilemma\'s around power, sex and control highlighted by a few sad lonely lives. The mother (very well acted by Maureen Carr) is uptight and drawn in on herself. The father only appears on the side-lines, and yet is a powerful and pivotal part of the drama. Money is hidden in boxes and shoes.<br /><br />The writing was superb, and I liked the sensual close-up shots of details such as nails, red lips, a candle, mirrors etc. The way the camera was used made it very intimate. It\'s a harrowing tale, with sexual undertones, while the Glasgow drizzle on the dark streets adds to the despair of the sad characters.<br /><br />There are some highly memorable shots conveyed simply by a walk, or a dropped shoulder - such as Trise walking away under the bridge. And the stunned and hurt look on Trise\'s face in the call centre, which hopes to helps people through using tarot cards, as she listens to a caller talk of her own abuse.<br /><br />At the start we see John Paul, wide-eyed and innocent, having photos shot as he wants to try modelling. Trise, his mother, is deluded and making poor choices for him, in a way pushing him away while she tries to keep him. John Paul\'s modelling turns into escort work and Trise\'s boss offers her money, and eventually they go on a date. There are also moments of humour and subtle irony. One excellent scene is when they are having a fairly normal meal, and starting to open up a bit, when the father appears with his dark presence and clouds everything over. But this, and other things offer moments of hope.<br /><br />I felt at times the pacing of the film was a shade too intense, but this is a small detail in another wise challenging and memorable film, and something a bit different. It stands in start contrast to most American films which are either total fantasy, or the real world as seen through tainted glasses. This film depicts life with all its rough edges and displays unforgettable images. <br /><br />This isn\'t \'light entertainment\' but a thought provoking and real life drama.<br /><br />One Life Stand is a truly involving and emotionally honest film.',
                 'Love and human remains directed by Denys Arcand is an abysmally pathetic film as it is completely different from the kind of films he has been making all through his career.Making a different film is not an objectionable matter, what is troublesome is the fact that if a film from a master is complete out of tune then it is a really bad event. The film begins on a good note as there is some suspense created. However as the film progresses what is shown is just a futile attempt at creating something meaningful as Arcand shows us half a dozen oddball, whimsical characters whose lives are intertwined with each other.Homosexuality and Lesbianism are not of any consequences here. What is even more bothersome is the feeling of guilt related to the characters who are rather in a fix regarding their feelings towards each other and sexuality.Such a film would be of interest to some who wants to see a different Denys Arcand film.All in all, there would surely not be many takers for this film.',
                 'House of Games is spell binding. It\'s so nice to occasionally see films that are perfect tens. There are few movies I\'ve seen that can grip you so quickly. From the opening scene this movie just gets you.<br /><br />I\'m trying really hard not to give to much away to those who may not yet have seen this but there will be a FEW SPOILERS SO DON\'T READ ANYMORE IF YOU DON\'T WANT TO KNOW.<br /><br />I would say House of Games is not just a superb film but is the best movie about con artists I have ever seen-bar none. From the moment the movie is over it begs to be replayed.<br /><br />Lindsay Crouse as Margaret Ford is simply perfection, from her mannerisms to the inflection of her voice she gets into the role immediately. Joe Mantegna was also wonderful. The dialogue in this movie has an unforced almost unscripted quality and these two people communicate as much in a look as they do with their voices. I also loved the way the movie was filmed, in that grainy, surreal type of way, it fit perfectly and helped make the film what it was.<br /><br />There were a few movies I\'ve seen and loved that this reminded me of including The Grifters and The usual Suspects but really, House of games is completely different in it\'s way. Margaret and Mike are two of the most absorbing characters I\'ve seen on the big screen and not only do they have screen chemistry that is strong and palpable from the moment they meet, but the buildup that starts from the moment they set eyes on each other is electrifying. You know something\'s going to happen but you have no idea what. And just when you think you\'ve guessed what the "something" is, you realize you haven\'t even scratched the surface....<br /><br />House of Games is one of those movies that may be lumped in to a certain genre of movie type but is essentially a movie about human nature. The character study is not just about the mind of the con artist but the victim as well. As the movie moves along and we get to know more and more about the main characters, we learn about them not just through what they say but how they say it. It is a great character study and is flawless in the way it speeds to it\'s conclusion.<br /><br />In closing, I\'d rank this 10 of 10, call it (although not my absolute favorite film, pretty high on the list), most definitely outstanding and would go so far as to say it does rank as one of the best character studies and contains some of the best "twists" I\'ve ever seen as well. Although I love all types and genres of movies, when it comes to movies of the human psyche, it really doesn\'t get much better then this. See this movie.',
                 'I thought this film would be a lot better then it was. It sounded like a spoof off of the spy gener, and the start of it reminded me of Pleasantvil, but this film came up short.<br /><br />The plot is just to ridiculous. The KGB and Soviet Union in Russia have started up a spy school to teach their spies\' how to act like Americans, but the town they set up in it for training is a bit dated, so they grab two yanks from the US to spice things up. I don\'t know, but this seems just to out there. It gets really odd when next to no one in this all Russian town speaks in a Russian accent. Someone screwed up in the casting job.<br /><br />Also, for a comedy this is painfully dry. There is one, two funny spots tops, and they are nothing to sing and dance about. The film in the end will likely put you to sleep.<br /><br />And, as a twisted punch in the face, this film is so pro the US it makes me sick. The movie keeps on saying again and again, the US is God and Russia is the devil. This is the kind of smear campaign that was done against the Japanese in World War 2. It\'s films like these that makes everyone think that the US is full of itself.<br /><br />This gets a 4 out of 10, and I\'m being kind. It should really get a one, but the dance scene was funny, but then again it dragged far to long to be really funny.',
                 'ROCK STAR is a well-told Hollywood-style rendition of the tale based on fact actually on how Ripper became Rob Halford\'s replacement for Judas Priest. Mark Wahlberg poured on his likable boy-ish charm and performed with believable admirably, something he has been known to do since the release of BOOGIE NIGHTS.<br /><br />Stephen Herek, no stranger to musically-themed movies, takes the audience through the wonders of the breakneck lifestyle of an extinct species, the Hair-Metal Rock God. Wahlberg\'s "Izzy" acts as the film\'s host plays the everyman who gets to see his wish come true. His likable character quickly wins over the heart of the viewer, who wants to see him succeed and gets the chance to give him the Metal "goat horn" hand-sign several times over.<br /><br />The only real complaint with the story is that the supporting cast, namely the other members of the band, were not fleshed out, or even introduced, properly. More interaction with these life-long Rock musicians would have amplified and solidified Izzy\'s new surroundings. <br /><br />Naturally, ROCK STAR is filled with great music. Rabin\'s score, the Steel Dragon\'s original work and plenty of 80\'s-style Metal hits makes this soundtrack a must-have! Let\'s all hope that films like ROCK STAR not only give a credibility to a style of music that helped define a generation but also spark a very-needed revival.',
                 'Any movie in which Brooke Shields out-acts a Fonda is going to be both an anomaly and a horror. Shields actually is only bad because she\'s youthful, inexperienced, and clearly not well directed by her co-star. Peter Fonda is bad because, well, because he\'s bad. I liked him in Ulee\'s Gold, years later, but Lord above, he\'s awful here. Not that anyone else is good. There\'s not a single performance (outside Henry Fonda\'s delightful cameo) that is even passable. I\'ve never seen a movie with this many bad performances. In the case of Luke Askew, the chief villain, it\'s clear this is because of poor dialogue and direction, as he\'s done good work in the past. But his partner, played by Ted Markland, is an embarrassing ham. The writing is just bloody awful, and the actors cannot be faulted for the terrible things they have to say. But they say them so badly! The editing and direction are worse than pedestrian. Shots are held way too long for no dramatic reason, or cut off before the impact of the scene can be realized. This picture was far worse than I\'d imagined and would have been utterly forgotten (and probably never even made) without the participation of a couple of famous names. One bright spot: the cinematography in the Grand Canyon is exquisite, capturing the beauty of that area in a way even big-screen Imax productions have not quite done so well. And finally: either this is a bad version of Paper Moon, with a lovable pair of father-daughter types, or it\'s a bad version of Pretty Baby, with a considerably more icky romantic relationship between a forty-something and a 13-year-old. It suggests more of the latter than the former, and thus is pretty disturbing.']

all_movie_reviews = ' '.join(movie_reviews)


#Pre-processing (can be enhanced and customized as needed)

def preprocess_text(document):

  # Remove HTML tags
  document = re.sub(r'<.*?>', '', document)

  #tokens = word_tokenize(document.lower())
  #tokens = [word for word in tokens if word not in string.punctuation]

  #stop_words = set(stopwords.words('english'))
  #tokens = [word for word in tokens if word not in stop_words]

  #lemmatizer = WordNetLemmatizer()
  #lemmatized_words = [lemmatizer.lemmatize(token) for token in tokens]

  #return ' '.join(tokens)
  return document
  
all_movie_reviews = preprocess_text(all_movie_reviews)
all_movie_reviews


#Word Cloud to check the most occuring words

wordcloud = WordCloud(width=800, height=600, background_color="white").generate(all_movie_reviews)

plt.figure(figsize=(16, 10))
plt.imshow(wordcloud, interpolation='nearest')
plt.axis("off")
plt.title("Word Cloud", fontsize=16)

plt.show()


#Extracting entities using Spacy Library (Non pre-trained model)

# Load the English language model
nlp = spacy.load("en_core_web_sm")

# Extract txt and labels the text
doc = nlp(all_movie_reviews)

# Extract entities and relations
entities = [(entity.text, entity.label_) for entity in doc.ents]

# Print extracted entities and relations
print(f"\nLength of Named Entities: {len(entities)} and Named Entities are: \n")
for entity in entities:
  print(entity)
  

#Let's do a bar chart to understand category of entities against the count of each.

# Counting the occurances of each label.
label_counts = {}
for _, label in entities:
    if label in label_counts:
        label_counts[label] += 1
    else:
        label_counts[label] = 1

# Sort labels by count
sorted_labels = sorted(label_counts.items(), key=lambda x: x[1], reverse=True)
labels = [label[0] for label in sorted_labels]
counts = [label[1] for label in sorted_labels]

# Plotting the horizontal bar chart
plt.figure(figsize=(10, 6))
plt.barh(labels, counts, color='orange')
plt.xlabel('Count')
plt.ylabel('Entity Label')
plt.title('Named Entity Recognition Horizontal Bar Chart')
plt.gca().invert_yaxis()  # Invert y-axis to display the highest count on top
plt.show()


#Extract relations

relations = []
for token in doc:
  if token.dep_ in ["nsubj", "nsubjpass"]:
    subject = token.text
    verb = token.head.text
    for child in token.children:
      if child.dep_ == "prep":
        prep = child.text
        for obj in child.children:
          if obj.dep_ in ["pobj", "dobj"]:
            obj_text = obj.text
            relations.append((subject, verb, prep, obj_text))

print(f"\n Length of Relations: {len(relations)} and Relations are: \n ")
for relation in relations:
  print(relation)


#Knowledge Graph for Visualization

def develop_knowledge_graph(sp_df):

  indexes = []
  text_entities = []
  entity_types = []
  relationships = []

  for idx, row in sp_df.iterrows():
    index = row['index']
    text = row['text']
    entities = row['entities']
    labels = row['labels']

    # Extract relationships between text and entities based on labels
    for i in range(len(entities)):
      indexes.append(index)
      text_entities.append(text)
      entity_types.append(entities[i])
      relationships.append(labels[i])

  relationship_df = pd.DataFrame({ 'Index':indexes, 'Text': text_entities, 'Entities': entity_types, 'Relationship': relationships })


  graph = nx.DiGraph()

  #Add edges and relationships to the graph
  for _, row in relationship_df.iterrows():
    index = row['Index']
    text = row['Text']
    entity = row['Entities']
    relationship = row['Relationship']
    graph.add_edge(index, entity, relationship=relationship, desc=text)

  #Display nodes, edges, and their attributes
  print("Nodes:", graph.nodes())
  print("Edges:")
  for edge in graph.edges(data=True):
    print(edge)
  print("\n\n")




  #Perform connected component analysis
  connected_components = list(nx.connected_components(graph.to_undirected()))

  #Find the connected components with more than one node
  connected_components = [component for component in connected_components if len(component) > 1]

  #Display the connected components
  print("Connected components:")
  for idx, component in enumerate(connected_components, start=1):
    print(f"Component {idx}: {component}")

  #Visualize the graph (optional)
  pos = nx.spring_layout(graph)
  nx.draw(graph, pos, with_labels=True, node_size=500, font_size=8)

  plt.show()
  
  
data = {'text': [], 'entities': [], 'labels': []}

for text in movie_reviews:
  text = preprocess_text(text)
  doc = nlp(text)
  entity_texts = [ent.text for ent in doc.ents]
  labels = [ent.label_ for ent in doc.ents]
  data['text'].append(text)
  data['entities'].append(entity_texts)
  data['labels'].append(labels)

sp_df = pd.DataFrame(data)
sp_df.reset_index(inplace=True)

sp_df.head(5)


## Develop knowledge graph

develop_knowledge_graph(sp_df)

-------------------------------------------------


#Hugging face/Transformer models

#dslim/bert-base-NER refers to a pre-trained model for Named entity Recognition (NER).

#en_core_web_trf is a pretrained statistical language model for English offered by spaCy. It is used in various NLP tasks such as NER, Part-of-Speech (POS), etc.

import spacy.cli
spacy.cli.download("en_core_web_trf")

from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline

tokenizer = AutoTokenizer.from_pretrained("dslim/bert-base-NER")
model = AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")

nlp_spacy = spacy.load("en_core_web_trf")
nlp_ner = pipeline("ner", model = model, tokenizer=tokenizer)

all_movie_reviews = preprocess_text(all_movie_reviews)

ner_results = nlp_ner(all_movie_reviews)
doc = nlp_spacy(all_movie_reviews)

print("\n Named Entity Results:\n")
for ner_result in ner_results:
  print(ner_result)
print("\n\n")

# Extract entities and relations
entities = [(entity.text, entity.label_) for entity in doc.ents]

# Print extracted entities and relations
print(f"\nLength of Named Entities: {len(entities)} and Named Entities are: \n")
for entity in entities:
  print(entity)
  
# Counting the occurances of each label.
label_counts = {}
for _, label in entities:
    if label in label_counts:
        label_counts[label] += 1
    else:
        label_counts[label] = 1

# Sort labels by count
sorted_labels = sorted(label_counts.items(), key=lambda x: x[1], reverse=True)
labels = [label[0] for label in sorted_labels]
counts = [label[1] for label in sorted_labels]

# Plotting the horizontal bar chart
plt.figure(figsize=(10, 6))
plt.barh(labels, counts, color='orange')
plt.xlabel('Count')
plt.ylabel('Entity Label')
plt.title('Named Entity Recognition Horizontal Bar Chart')
plt.gca().invert_yaxis()  # Invert y-axis to display the highest count on top
plt.show()


relations = []
for token in doc:
  if token.dep_ in ["nsubj", "nsubjpass"]:
    subject = token.text
    verb = token.head.text
    for child in token.children:
      if child.dep_ == "prep":
        prep = child.text
        for obj in child.children:
          if obj.dep_ in ["pobj", "dobj"]:
            obj_text = obj.text
            relations.append((subject, verb, prep, obj_text))

print(f"\n Length of Relations: {len(relations)} and Relations are: \n ")
for relation in relations:
  print(relation)
  
  
#Knowledge graphs

data = {'text': [], 'entities': [], 'labels': []}

for text in movie_reviews:
  text = preprocess_text(text)
  doc = nlp_spacy(text)
  entity_texts = [ent.text for ent in doc.ents]
  labels = [ent.label_ for ent in doc.ents]
  data['text'].append(text)
  data['entities'].append(entity_texts)
  data['labels'].append(labels)

sp_df = pd.DataFrame(data)
sp_df.reset_index(inplace=True)

sp_df.head(5)

## Develop knowledge graph (Newer Model)

develop_knowledge_graph(sp_df)